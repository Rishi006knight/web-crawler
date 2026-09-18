package com.ssn.webcrawler.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssn.webcrawler.model.*;
import jakarta.annotation.PostConstruct;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Production-ready queue-based web crawler service.
 * Backed by Redis persistent queue, job storage, robots.txt caching,
 * politeness rate limiter, sitemaps, and content deduplication.
 */
@Service
public class CrawlerService {

    private static final Logger log = LoggerFactory.getLogger(CrawlerService.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    private static final String JOB_KEY_PREFIX = "crawler:job:";
    private static final String ALL_JOBS_KEY = "crawler:jobs:all";
    private static final String QUEUE_KEY_PREFIX = "crawler:queue:";
    private static final String VISITED_KEY_PREFIX = "crawler:visited:";

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final RobotsTxtService robotsTxtService;
    private final PolitenessRateLimiter politenessRateLimiter;
    private final SitemapService sitemapService;
    private final ContentDeduplicator contentDeduplicator;

    private final ExecutorService executor;
    private final Map<String, CrawlResult> liveJobs = new ConcurrentHashMap<>();

    @Value("${crawler.thread-pool-size:8}")
    private int threadPoolSize;

    @Value("${crawler.page-cache-ttl-seconds:3600}")
    private long pageCacheTtlSeconds;

    @Value("${crawler.job-ttl-days:7}")
    private long jobTtlDays;

    @Value("${crawler.allowed-schemes:http,https}")
    private String allowedSchemesCsv;

    @Value("${crawler.request-timeout-ms:5000}")
    private int requestTimeoutMs;

    @Value("${crawler.max-retries:2}")
    private int maxRetries;

    public CrawlerService(RedisTemplate<String, String> redisTemplate,
                          ObjectMapper objectMapper,
                          RobotsTxtService robotsTxtService,
                          PolitenessRateLimiter politenessRateLimiter,
                          SitemapService sitemapService,
                          ContentDeduplicator contentDeduplicator) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.robotsTxtService = robotsTxtService;
        this.politenessRateLimiter = politenessRateLimiter;
        this.sitemapService = sitemapService;
        this.contentDeduplicator = contentDeduplicator;
        this.executor = Executors.newFixedThreadPool(8);
    }

    @PostConstruct
    public void init() {
        log.info("Initializing CrawlerService. Checking for existing jobs in Redis...");
        try {
            Set<String> allJobIds = redisTemplate.opsForSet().members(ALL_JOBS_KEY);
            if (allJobIds != null) {
                for (String jobId : allJobIds) {
                    CrawlResult result = loadJobFromRedis(jobId);
                    if (result != null && "RUNNING".equals(result.getStatus())) {
                        String queueKey = queueKey(jobId);
                        Long queueSize = redisTemplate.opsForList().size(queueKey);
                        if (queueSize != null && queueSize > 0) {
                            log.info("Resuming unfinished crawl job: {} (remaining queue: {})", jobId, queueSize);
                            liveJobs.put(jobId, result);
                            executor.submit(() -> runCrawlFromQueue(result));
                        } else {
                            result.setStatus("COMPLETED");
                            persistJob(result);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed checking existing jobs during startup: {}", e.getMessage());
        }
    }

    /**
     * Submits a new crawl job with full parameter options.
     */
    public CrawlResult startCrawl(CrawlRequest request) {
        String seedUrl = request.getSeedUrl().trim();
        if (!isValidUrl(seedUrl)) {
            throw new IllegalArgumentException("Invalid or disallowed seed URL: " + seedUrl);
        }

        String jobId = UUID.randomUUID().toString();
        CrawlResult result = new CrawlResult(jobId, seedUrl, "QUEUED", 0, 0, 0, new ArrayList<>());
        result.setScope(request.getScope() != null ? request.getScope() : DomainScope.SAME_DOMAIN);
        result.setRespectRobotsTxt(request.isRespectRobotsTxt());
        result.setUseSitemap(request.isUseSitemap());

        liveJobs.put(jobId, result);
        redisTemplate.opsForSet().add(ALL_JOBS_KEY, jobId);
        persistJob(result);

        executor.submit(() -> runNewCrawl(result, request.getMaxDepth(), request.getMaxPages(), request.getKeyword()));
        return result;
    }

    /** Backward compatible startCrawl overload */
    public CrawlResult startCrawl(String seedUrl, int maxDepth, int maxPages, String keyword) {
        CrawlRequest req = new CrawlRequest();
        req.setSeedUrl(seedUrl);
        req.setMaxDepth(maxDepth);
        req.setMaxPages(maxPages);
        req.setKeyword(keyword);
        req.setScope(DomainScope.SAME_DOMAIN);
        req.setRespectRobotsTxt(true);
        req.setUseSitemap(false);
        return startCrawl(req);
    }

    public CrawlResult startCrawl(String seedUrl, int maxDepth, int maxPages) {
        return startCrawl(seedUrl, maxDepth, maxPages, null);
    }

    public CrawlResult getJob(String jobId) {
        CrawlResult live = liveJobs.get(jobId);
        if (live != null) {
            return live;
        }
        CrawlResult persisted = loadJobFromRedis(jobId);
        if (persisted != null) {
            return persisted;
        }
        throw new NoSuchElementException("No such job: " + jobId);
    }

    public Collection<CrawlResult> getAllJobs() {
        List<CrawlResult> results = new ArrayList<>();
        Set<String> jobIds = redisTemplate.opsForSet().members(ALL_JOBS_KEY);
        if (jobIds != null) {
            for (String jobId : jobIds) {
                CrawlResult r = liveJobs.get(jobId);
                if (r == null) {
                    r = loadJobFromRedis(jobId);
                }
                if (r != null) {
                    results.add(r);
                }
            }
        }
        results.sort((a, b) -> Long.compare(b.getStartTime(), a.getStartTime()));
        return results;
    }

    public void clearCache(String jobId) {
        redisTemplate.delete(visitedSetKey(jobId));
        redisTemplate.delete(queueKey(jobId));
        contentDeduplicator.clearHashes(jobId);
    }

    public void deleteJob(String jobId) {
        liveJobs.remove(jobId);
        redisTemplate.opsForSet().remove(ALL_JOBS_KEY, jobId);
        redisTemplate.delete(jobKey(jobId));
        clearCache(jobId);
    }

    /**
     * Computes global analytics across all recorded jobs.
     */
    public CrawlerStats getStats() {
        CrawlerStats stats = new CrawlerStats();
        Collection<CrawlResult> allJobs = getAllJobs();

        long totalPages = 0;
        long totalDiscovered = 0;
        long totalDuration = 0;
        long activeCount = 0;
        long completedCount = 0;
        long failedCount = 0;
        Set<String> uniqueDomains = new HashSet<>();
        Set<String> uniqueEmails = new HashSet<>();
        Map<String, Integer> domainCounts = new HashMap<>();

        for (CrawlResult job : allJobs) {
            if ("RUNNING".equals(job.getStatus()) || "QUEUED".equals(job.getStatus())) {
                activeCount++;
            } else if ("COMPLETED".equals(job.getStatus())) {
                completedCount++;
            } else if ("FAILED".equals(job.getStatus())) {
                failedCount++;
            }

            totalPages += job.getPagesVisited();
            totalDiscovered += job.getUrlsDiscovered();
            totalDuration += job.getDurationMillis();

            if (job.getPageInfos() != null) {
                for (PageInfo page : job.getPageInfos()) {
                    String domain = safeHost(page.getUrl());
                    if (domain != null) {
                        uniqueDomains.add(domain);
                        domainCounts.put(domain, domainCounts.getOrDefault(domain, 0) + 1);
                    }
                    if (page.getEmailsFound() != null) {
                        uniqueEmails.addAll(page.getEmailsFound());
                    }
                }
            }
        }

        stats.setTotalJobs(allJobs.size());
        stats.setActiveJobCount(activeCount);
        stats.setCompletedJobs(completedCount);
        stats.setFailedJobs(failedCount);
        stats.setTotalPagesCrawled(totalPages);
        stats.setTotalUrlsDiscovered(totalDiscovered);
        stats.setTotalUniqueDomains(uniqueDomains.size());
        stats.setTotalEmailsDiscovered(uniqueEmails.size());
        stats.setAverageCrawlDurationMs(allJobs.isEmpty() ? 0 : (double) totalDuration / allJobs.size());

        // Sort top 10 domains
        Map<String, Integer> topDomains = new LinkedHashMap<>();
        domainCounts.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(10)
                .forEach(e -> topDomains.put(e.getKey(), e.getValue()));
        stats.setTopDomains(topDomains);

        return stats;
    }

    /**
     * Generates CSV export for a job's crawled pages.
     */
    public String exportCsv(String jobId) {
        CrawlResult job = getJob(jobId);
        StringWriter writer = new StringWriter();
        writer.write("URL,Title,H1,MetaDescription,WordCount,ImageCount,InternalLinks,ExternalLinks,IsDuplicate,IsDuplicateOf,Depth,StatusCode,EmailsFound,Snippet\n");

        if (job.getPageInfos() != null) {
            for (PageInfo p : job.getPageInfos()) {
                writer.write(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,%d,%d,%b,\"%s\",%d,%d,\"%s\",\"%s\"\n",
                        csvEscape(p.getUrl()),
                        csvEscape(p.getTitle()),
                        csvEscape(p.getH1()),
                        csvEscape(p.getMetaDescription()),
                        p.getWordCount(),
                        p.getImageCount(),
                        p.getInternalLinkCount(),
                        p.getExternalLinkCount(),
                        p.isDuplicate(),
                        csvEscape(p.getIsDuplicateOf()),
                        p.getDepth(),
                        p.getStatusCode(),
                        p.getEmailsFound() != null ? String.join("; ", p.getEmailsFound()) : "",
                        csvEscape(p.getSnippet())
                ));
            }
        }
        return writer.toString();
    }

    private String csvEscape(String text) {
        if (text == null) return "";
        return text.replace("\"", "\"\"").replace("\n", " ").replace("\r", " ");
    }

    // ---------------------------------------------------------------------------------------------
    // CRAWL EXECUTION ENGINE
    // ---------------------------------------------------------------------------------------------

    private void runNewCrawl(CrawlResult result, int maxDepth, int maxPages, String keyword) {
        String jobId = result.getJobId();
        String seedUrl = result.getSeedUrl();
        String queueKey = queueKey(jobId);
        String visitedKey = visitedSetKey(jobId);

        result.setStatus("RUNNING");
        persistJob(result);

        // Enqueue seed URL
        pushToQueue(queueKey, new UrlDepth(seedUrl, 0));
        result.setUrlsDiscovered(1);

        // 1. Check sitemap discovery if requested
        if (result.isUseSitemap()) {
            try {
                List<String> robotsSitemaps = result.isRespectRobotsTxt() ? robotsTxtService.getSitemaps(seedUrl) : Collections.emptyList();
                List<String> sitemapUrls = sitemapService.discoverUrls(seedUrl, robotsSitemaps);
                for (String smUrl : sitemapUrls) {
                    if (isValidUrl(smUrl) && isWithinScope(seedUrl, smUrl, result.getScope())) {
                        if (Boolean.FALSE.equals(redisTemplate.opsForSet().isMember(visitedKey, smUrl))) {
                            pushToQueue(queueKey, new UrlDepth(smUrl, 1));
                            result.setUrlsDiscovered(result.getUrlsDiscovered() + 1);
                        }
                    }
                }
                log.info("Sitemap discovery for {} added {} URLs to queue", seedUrl, sitemapUrls.size());
            } catch (Exception e) {
                log.warn("Sitemap discovery failed for {}: {}", seedUrl, e.getMessage());
            }
        }

        executeCrawlLoop(result, maxDepth, maxPages, keyword);
    }

    private void runCrawlFromQueue(CrawlResult result) {
        executeCrawlLoop(result, 3, 100, null);
    }

    private void executeCrawlLoop(CrawlResult result, int maxDepth, int maxPages, String keyword) {
        String jobId = result.getJobId();
        String seedUrl = result.getSeedUrl();
        String queueKey = queueKey(jobId);
        String visitedKey = visitedSetKey(jobId);
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.toLowerCase();

        long start = System.currentTimeMillis();
        List<String> visitedOrder = result.getVisitedUrls() != null ? new ArrayList<>(result.getVisitedUrls()) : new ArrayList<>();
        List<String> matched = result.getMatchedUrls() != null ? new ArrayList<>(result.getMatchedUrls()) : new ArrayList<>();
        List<PageInfo> pageInfos = result.getPageInfos() != null ? new ArrayList<>(result.getPageInfos()) : new ArrayList<>();
        List<FailedUrlInfo> failedUrls = result.getFailedUrls() != null ? new ArrayList<>(result.getFailedUrls()) : new ArrayList<>();
        int duplicates = result.getDuplicateCount();

        try {
            while (visitedOrder.size() < maxPages) {
                UrlDepth current = popFromQueue(queueKey);
                if (current == null) {
                    break; // queue empty
                }

                // 1. Visited check (Redis SET)
                if (Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(visitedKey, current.url))) {
                    continue;
                }
                if (!isValidUrl(current.url)) {
                    continue;
                }

                // 2. Robots.txt check
                if (result.isRespectRobotsTxt() && !robotsTxtService.isAllowed(current.url)) {
                    log.info("Skipping {} - disallowed by robots.txt", current.url);
                    failedUrls.add(new FailedUrlInfo(current.url, "Blocked by robots.txt Disallow rule", 403, 0));
                    continue;
                }

                // 3. Politeness delay & concurrency control
                long crawlDelayMs = result.isRespectRobotsTxt() ? robotsTxtService.getCrawlDelayMs(current.url) : 0;
                politenessRateLimiter.acquirePoliteAccess(current.url, crawlDelayMs);

                FetchedPage page = null;
                try {
                    page = fetchWithRetry(current.url, maxRetries);
                } finally {
                    politenessRateLimiter.releaseAccess(current.url);
                }

                if (page == null || !page.isSuccess()) {
                    String reason = page != null ? page.errorMessage : "Connection failed";
                    int code = page != null ? page.statusCode : 500;
                    int attempts = page != null ? page.attempts : maxRetries + 1;
                    failedUrls.add(new FailedUrlInfo(current.url, reason, code, attempts));
                    continue;
                }

                // Mark visited in Redis
                redisTemplate.opsForSet().add(visitedKey, current.url);
                visitedOrder.add(current.url);

                PageInfo info = page.info;
                if (info != null) {
                    info.setDepth(current.depth);
                    info.setStatusCode(page.statusCode);

                    // 4. Content Deduplication
                    String contentHash = contentDeduplicator.computeContentHash(page.text);
                    info.setContentHash(contentHash);
                    String duplicateOf = contentDeduplicator.checkAndRegisterDuplicate(jobId, contentHash, current.url);
                    if (duplicateOf != null) {
                        info.setDuplicate(true);
                        info.setIsDuplicateOf(duplicateOf);
                        duplicates++;
                    }
                    pageInfos.add(info);
                }

                // 5. Keyword match
                if (kw != null && page.text != null && page.text.toLowerCase().contains(kw)) {
                    matched.add(current.url);
                }

                // 6. Link exploration within maxDepth & scope
                if (current.depth < maxDepth && (info == null || !info.isDuplicate())) {
                    for (String link : page.links) {
                        if (isValidUrl(link) && isWithinScope(seedUrl, link, result.getScope())) {
                            if (Boolean.FALSE.equals(redisTemplate.opsForSet().isMember(visitedKey, link))) {
                                pushToQueue(queueKey, new UrlDepth(link, current.depth + 1));
                                result.setUrlsDiscovered(result.getUrlsDiscovered() + 1);
                            }
                        }
                    }
                }

                // Periodic progress update
                result.setPagesVisited(visitedOrder.size());
                result.setVisitedUrls(visitedOrder);
                result.setMatchedUrls(matched);
                result.setPageInfos(pageInfos);
                result.setFailedUrls(failedUrls);
                result.setDuplicateCount(duplicates);
                result.setDurationMillis(System.currentTimeMillis() - start);

                if (visitedOrder.size() % 2 == 0) {
                    persistJob(result);
                }
            }

            result.setStatus("COMPLETED");
        } catch (Exception e) {
            log.error("Crawl job {} failed with exception: {}", jobId, e.getMessage(), e);
            result.setStatus("FAILED");
            result.setErrorMessage(e.getMessage());
        } finally {
            result.setPagesVisited(visitedOrder.size());
            result.setVisitedUrls(visitedOrder);
            result.setMatchedUrls(matched);
            result.setPageInfos(pageInfos);
            result.setFailedUrls(failedUrls);
            result.setDuplicateCount(duplicates);
            result.setDurationMillis(System.currentTimeMillis() - start);
            result.setEndTime(System.currentTimeMillis());

            persistJob(result);
            redisTemplate.expire(visitedKey, Duration.ofSeconds(pageCacheTtlSeconds));
            liveJobs.remove(jobId);
        }
    }

    /**
     * Fetches a page with exponential backoff retry on failures.
     */
    private FetchedPage fetchWithRetry(String url, int maxRetries) {
        int attempt = 0;
        long backoffMs = 1000;
        Exception lastException = null;

        while (attempt <= maxRetries) {
            attempt++;
            try {
                FetchedPage page = fetchAndExtractLinks(url);
                page.attempts = attempt;
                return page;
            } catch (Exception e) {
                lastException = e;
                log.warn("Attempt {}/{} failed for URL {}: {}", attempt, maxRetries + 1, url, e.getMessage());
                if (attempt <= maxRetries) {
                    try {
                        Thread.sleep(backoffMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    backoffMs *= 3; // Exponential backoff: 1s, 3s
                }
            }
        }

        FetchedPage failed = new FetchedPage(Collections.emptySet(), null, null);
        failed.success = false;
        failed.attempts = attempt;
        failed.errorMessage = lastException != null ? lastException.getMessage() : "Failed after retries";
        failed.statusCode = 500;
        return failed;
    }

    private FetchedPage fetchAndExtractLinks(String url) throws Exception {
        String cacheKey = "crawler:page:" + Integer.toHexString(url.hashCode());
        String textCacheKey = cacheKey + ":text";
        String cachedLinks = redisTemplate.opsForValue().get(cacheKey);

        if (cachedLinks != null) {
            Set<String> links = cachedLinks.isEmpty() ? Set.of() : new HashSet<>(Arrays.asList(cachedLinks.split("\\|")));
            String cachedText = redisTemplate.opsForValue().get(textCacheKey);
            PageInfo info = cachedText == null ? null : buildPageInfo(url, null, null, null, cachedText, 0, links.size(), 0);
            FetchedPage fp = new FetchedPage(links, cachedText, info);
            fp.success = true;
            fp.statusCode = 200;
            return fp;
        }

        Set<String> links = new LinkedHashSet<>();
        Connection.Response response = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 (SSN-WebCrawler/2.0)")
                .timeout(requestTimeoutMs)
                .followRedirects(true)
                .ignoreHttpErrors(false) // throw for 4xx/5xx so retry can handle or catch
                .ignoreContentType(true)
                .execute();

        Document doc = response.parse();
        int statusCode = response.statusCode();

        String pageHost = safeHost(url);
        int internalCount = 0, externalCount = 0;
        for (Element a : doc.select("a[href]")) {
            String abs = a.attr("abs:href");
            if (isValidUrl(abs)) {
                links.add(abs);
                if (pageHost != null && pageHost.equalsIgnoreCase(safeHost(abs))) {
                    internalCount++;
                } else {
                    externalCount++;
                }
            }
        }

        String text = doc.text();
        String title = doc.title();
        String metaDesc = doc.select("meta[name=description]").attr("content");
        String h1 = doc.select("h1").isEmpty() ? null : doc.select("h1").first().text();
        int imageCount = doc.select("img").size();

        PageInfo info = buildPageInfo(url, title, metaDesc, h1, text, imageCount, internalCount, externalCount);

        try {
            redisTemplate.opsForValue().set(cacheKey, String.join("|", links), Duration.ofSeconds(pageCacheTtlSeconds));
            redisTemplate.opsForValue().set(textCacheKey, text, Duration.ofSeconds(pageCacheTtlSeconds));
        } catch (Exception e) {
            log.debug("Failed caching page to Redis: {}", e.getMessage());
        }

        FetchedPage fp = new FetchedPage(links, text, info);
        fp.success = true;
        fp.statusCode = statusCode;
        return fp;
    }

    private PageInfo buildPageInfo(String url, String title, String metaDesc, String h1, String text,
                                   int imageCount, int internalLinks, int externalLinks) {
        int wordCount = text == null || text.isBlank() ? 0 : text.trim().split("\\s+").length;
        List<String> emails = new ArrayList<>();
        if (text != null) {
            Matcher m = EMAIL_PATTERN.matcher(text);
            while (m.find() && emails.size() < 10) {
                String email = m.group();
                if (!emails.contains(email)) {
                    emails.add(email);
                }
            }
        }
        String snippet = text == null ? null : text.substring(0, Math.min(200, text.length()));
        return new PageInfo(url, title, metaDesc, h1, wordCount, imageCount, internalLinks, externalLinks, emails, snippet);
    }

    // ---------------------------------------------------------------------------------------------
    // DOMAIN SCOPE & URL UTILITIES
    // ---------------------------------------------------------------------------------------------

    public boolean isWithinScope(String seedUrl, String candidateUrl, DomainScope scope) {
        if (scope == null || scope == DomainScope.ANY) {
            return true;
        }

        String seedHost = safeHost(seedUrl);
        String candidateHost = safeHost(candidateUrl);
        if (seedHost == null || candidateHost == null) {
            return false;
        }

        seedHost = normalizeHost(seedHost);
        candidateHost = normalizeHost(candidateHost);

        if (scope == DomainScope.SAME_DOMAIN) {
            return seedHost.equalsIgnoreCase(candidateHost);
        } else if (scope == DomainScope.SAME_DOMAIN_AND_SUBDOMAINS) {
            return candidateHost.equalsIgnoreCase(seedHost) || candidateHost.endsWith("." + seedHost);
        }

        return true;
    }

    private String normalizeHost(String host) {
        return host.startsWith("www.") ? host.substring(4) : host;
    }

    private String safeHost(String url) {
        try {
            return new URI(url).getHost();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isValidUrl(String url) {
        if (url == null || url.isBlank()) return false;
        try {
            URI uri = new URI(url);
            URL parsed = uri.toURL();
            String scheme = parsed.getProtocol();
            List<String> allowed = Arrays.asList(allowedSchemesCsv.split(","));
            return allowed.contains(scheme) && parsed.getHost() != null;
        } catch (MalformedURLException | URISyntaxException | IllegalArgumentException e) {
            return false;
        }
    }

    // ---------------------------------------------------------------------------------------------
    // REDIS PERSISTENCE HELPERS
    // ---------------------------------------------------------------------------------------------

    private void pushToQueue(String queueKey, UrlDepth item) {
        try {
            String json = objectMapper.writeValueAsString(item);
            redisTemplate.opsForList().rightPush(queueKey, json);
        } catch (JsonProcessingException e) {
            log.error("Failed encoding queue item: {}", e.getMessage());
        }
    }

    private UrlDepth popFromQueue(String queueKey) {
        try {
            String json = redisTemplate.opsForList().leftPop(queueKey);
            if (json != null) {
                return objectMapper.readValue(json, UrlDepth.class);
            }
        } catch (Exception e) {
            log.error("Failed decoding queue item: {}", e.getMessage());
        }
        return null;
    }

    private void persistJob(CrawlResult result) {
        try {
            String json = objectMapper.writeValueAsString(result);
            String key = jobKey(result.getJobId());
            redisTemplate.opsForValue().set(key, json, Duration.ofDays(jobTtlDays));
            redisTemplate.opsForSet().add(ALL_JOBS_KEY, result.getJobId());
        } catch (Exception e) {
            log.warn("Failed persisting job {} to Redis: {}", result.getJobId(), e.getMessage());
        }
    }

    private CrawlResult loadJobFromRedis(String jobId) {
        try {
            String json = redisTemplate.opsForValue().get(jobKey(jobId));
            if (json != null && !json.isBlank()) {
                return objectMapper.readValue(json, CrawlResult.class);
            }
        } catch (Exception e) {
            log.warn("Failed loading job {} from Redis: {}", jobId, e.getMessage());
        }
        return null;
    }

    private String jobKey(String jobId) {
        return JOB_KEY_PREFIX + jobId;
    }

    private String queueKey(String jobId) {
        return QUEUE_KEY_PREFIX + jobId;
    }

    private String visitedSetKey(String jobId) {
        return VISITED_KEY_PREFIX + jobId;
    }

    public static class FetchedPage {
        public Set<String> links;
        public String text;
        public PageInfo info;
        public boolean success = false;
        public int statusCode = 200;
        public int attempts = 1;
        public String errorMessage;

        public FetchedPage(Set<String> links, String text, PageInfo info) {
            this.links = links;
            this.text = text;
            this.info = info;
        }

        public boolean isSuccess() { return success; }
    }

    public static class UrlDepth {
        private String url;
        private int depth;

        public UrlDepth() {}
        public UrlDepth(String url, int depth) {
            this.url = url;
            this.depth = depth;
        }

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public int getDepth() { return depth; }
        public void setDepth(int depth) { this.depth = depth; }
    }
}
