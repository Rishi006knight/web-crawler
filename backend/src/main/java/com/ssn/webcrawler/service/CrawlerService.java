package com.ssn.webcrawler.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssn.webcrawler.entity.CrawlJobEntity;
import com.ssn.webcrawler.entity.PageDataEntity;
import com.ssn.webcrawler.model.ContentBlock;
import com.ssn.webcrawler.model.CrawlAttempt;
import com.ssn.webcrawler.model.CrawlJob;
import com.ssn.webcrawler.model.CrawlRequest;
import com.ssn.webcrawler.model.PageData;
import com.ssn.webcrawler.repository.CrawlJobRepository;
import com.ssn.webcrawler.repository.PageDataRepository;
import com.ssn.webcrawler.security.RateLimiterService;
import com.ssn.webcrawler.security.UrlSecurityValidator;
import org.jsoup.Connection;
import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.net.ssl.SSLException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

@Service
public class CrawlerService {

    private static final Logger log = LoggerFactory.getLogger(CrawlerService.class);

    private static final List<String> BOT_CHALLENGE_MARKERS = List.of(
            "Just a moment...",
            "cf-chl",
            "Checking your browser",
            "Attention Required",
            "Access denied",
            "Enable JavaScript and cookies",
            "_cf_chl_opt",
            "DDoS protection by"
    );

    private final CrawlJobRepository crawlJobRepository;
    private final PageDataRepository pageDataRepository;
    private final UrlSecurityValidator urlSecurityValidator;
    private final RateLimiterService rateLimiterService;
    private final RobotsTxtService robotsTxtService;
    private final UrlNormalizer urlNormalizer;
    private final CrawlStreamService crawlStreamService;

    private final ConcurrentHashMap<String, CrawlJob> activeJobs = new ConcurrentHashMap<>();
    private final ExecutorService jobMasterExecutor = Executors.newFixedThreadPool(4);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile String latestJobId = null;

    public CrawlerService(CrawlJobRepository crawlJobRepository,
                          PageDataRepository pageDataRepository,
                          UrlSecurityValidator urlSecurityValidator,
                          RateLimiterService rateLimiterService,
                          RobotsTxtService robotsTxtService) {
        this(crawlJobRepository, pageDataRepository, urlSecurityValidator, rateLimiterService, robotsTxtService, new UrlNormalizer(), new CrawlStreamService());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public CrawlerService(CrawlJobRepository crawlJobRepository,
                          PageDataRepository pageDataRepository,
                          UrlSecurityValidator urlSecurityValidator,
                          RateLimiterService rateLimiterService,
                          RobotsTxtService robotsTxtService,
                          UrlNormalizer urlNormalizer,
                          CrawlStreamService crawlStreamService) {
        this.crawlJobRepository = crawlJobRepository;
        this.pageDataRepository = pageDataRepository;
        this.urlSecurityValidator = urlSecurityValidator;
        this.rateLimiterService = rateLimiterService;
        this.robotsTxtService = robotsTxtService;
        this.urlNormalizer = urlNormalizer;
        this.crawlStreamService = crawlStreamService;
    }

    public CrawlJob startCrawl(CrawlRequest request) {
        return startCrawl(request, "127.0.0.1");
    }

    public CrawlJob startCrawl(CrawlRequest request, String clientIp) {
        String rawUrl = request.getUrl();
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Target URL cannot be empty");
        }

        urlSecurityValidator.validateUrl(rawUrl);

        String normalizedUrl = request.isUrlNormalization()
                ? urlNormalizer.normalize(rawUrl)
                : rawUrl.trim();

        String jobId = UUID.randomUUID().toString();
        int maxPages = request.getEffectiveMaxPages();
        int maxDepth = request.getEffectiveMaxDepth();
        int concurrency = request.getEffectiveConcurrency();

        CrawlJob job = new CrawlJob(jobId, normalizedUrl, maxPages, maxDepth);
        job.setIgnoreRobotsTxt(request.isIgnoreRobotsTxt());
        job.setConcurrency(concurrency);
        activeJobs.put(jobId, job);
        latestJobId = jobId;

        // Persist initial job record
        try {
            CrawlJobEntity entity = new CrawlJobEntity(jobId, normalizedUrl, maxPages, maxDepth);
            crawlJobRepository.save(entity);
            log.info("Saved new crawl job to Neon PostgreSQL: {}", jobId);
        } catch (Exception e) {
            log.error("Failed to persist job to Neon PostgreSQL: {}", e.getMessage());
        }

        rateLimiterService.incrementActiveJob(clientIp);
        jobMasterExecutor.submit(() -> executeCrawl(job, request, clientIp));
        return job;
    }

    public SseEmitter subscribeToStream(String jobId) {
        return crawlStreamService.subscribe(jobId);
    }

    public CrawlJob getJob(String jobId) {
        CrawlJob job = activeJobs.get(jobId);
        if (job != null) {
            return job;
        }

        return crawlJobRepository.findById(jobId)
                .map(this::toDto)
                .orElse(null);
    }

    public CrawlJob getJobSince(CrawlJob job, int sinceIndex) {
        CrawlJob partial = new CrawlJob(job.getJobId(), job.getStartUrl(), job.getMaxPages(), job.getMaxDepth());
        partial.setStatus(job.getStatus());
        partial.setPagesCrawled(job.getPagesCrawled());
        partial.setDiscoveredUrlsCount(job.getDiscoveredUrlsCount());
        partial.setDuplicatesSkippedCount(job.getDuplicatesSkippedCount());
        partial.setConcurrency(job.getConcurrency());
        partial.setStartTime(job.getStartTime());
        partial.setEndTime(job.getEndTime());
        partial.setErrorMessage(job.getErrorMessage());
        partial.setErrorSummary(job.getErrorSummary());

        List<PageData> allPages = job.getPages();
        if (allPages != null && sinceIndex < allPages.size()) {
            partial.setPages(new ArrayList<>(allPages.subList(Math.max(0, sinceIndex), allPages.size())));
        } else {
            partial.setPages(Collections.emptyList());
        }
        return partial;
    }

    public PageData getPageByIndex(String jobId, int pageIndex) {
        CrawlJob job = getJob(jobId);
        if (job == null || job.getPages() == null) {
            return null;
        }
        if (pageIndex >= 0 && pageIndex < job.getPages().size()) {
            return job.getPages().get(pageIndex);
        }
        return null;
    }

    public CrawlJob getLatestJob() {
        if (latestJobId != null && activeJobs.containsKey(latestJobId)) {
            return activeJobs.get(latestJobId);
        }

        return crawlJobRepository.findFirstByOrderByStartTimeDesc()
                .map(this::toDto)
                .orElse(null);
    }

    public boolean stopJob(String jobId) {
        CrawlJob job = activeJobs.get(jobId);
        if (job != null && "RUNNING".equals(job.getStatus())) {
            job.setStatus("STOPPED");
            job.setEndTime(System.currentTimeMillis());

            crawlStreamService.emit(jobId, "job.completed", job);
            crawlStreamService.complete(jobId);

            try {
                crawlJobRepository.findById(jobId).ifPresent(entity -> {
                    entity.setStatus("STOPPED");
                    entity.setEndTime(job.getEndTime());
                    crawlJobRepository.save(entity);
                });
            } catch (Exception e) {
                log.warn("Failed to update stopped status in database: {}", e.getMessage());
            }
            return true;
        }
        return false;
    }

    private void executeCrawl(CrawlJob job, CrawlRequest request, String clientIp) {
        log.info("Starting concurrent crawl job {} for URL: {} (concurrency: {})",
                job.getJobId(), job.getStartUrl(), job.getConcurrency());

        String startUrl = job.getStartUrl();
        String targetHost = extractHost(startUrl);

        Queue<CrawlTask> queue = new ConcurrentLinkedQueue<>();
        Set<String> visited = ConcurrentHashMap.newKeySet();
        Set<String> discovered = ConcurrentHashMap.newKeySet();

        queue.offer(new CrawlTask(startUrl, 0, null));
        discovered.add(startUrl);
        job.setDiscoveredUrlsCount(1);

        crawlStreamService.emit(job.getJobId(), "job.started", job);
        crawlStreamService.emit(job.getJobId(), "url.discovered", Map.of("url", startUrl, "discoveredCount", 1));

        CrawlJobEntity jobEntity = crawlJobRepository.findById(job.getJobId()).orElse(null);

        int concurrency = job.getConcurrency();
        ExecutorService workerPool = Executors.newFixedThreadPool(concurrency);
        AtomicInteger inFlight = new AtomicInteger(0);

        Pattern includeRegex = null;
        if (request.getIncludePattern() != null && !request.getIncludePattern().isBlank()) {
            try {
                includeRegex = Pattern.compile(request.getIncludePattern());
            } catch (Exception e) {
                log.warn("Invalid includePattern regex: {}", e.getMessage());
            }
        }

        Pattern excludeRegex = null;
        if (request.getExcludePattern() != null && !request.getExcludePattern().isBlank()) {
            try {
                excludeRegex = Pattern.compile(request.getExcludePattern());
            } catch (Exception e) {
                log.warn("Invalid excludePattern regex: {}", e.getMessage());
            }
        }

        try {
            while ("RUNNING".equals(job.getStatus()) && job.getPages().size() < job.getMaxPages()) {
                if (queue.isEmpty() && inFlight.get() == 0) {
                    break;
                }

                if (!queue.isEmpty() && inFlight.get() < concurrency && (job.getPages().size() + inFlight.get()) < job.getMaxPages()) {
                    CrawlTask task = queue.poll();
                    if (task == null) {
                        continue;
                    }

                    String currentUrl = task.url;
                    if (!visited.add(currentUrl)) {
                        continue;
                    }

                    inFlight.incrementAndGet();
                    final Pattern finalInclude = includeRegex;
                    final Pattern finalExclude = excludeRegex;

                    workerPool.submit(() -> {
                        try {
                            processUrl(task, job, targetHost, request, queue, visited, discovered,
                                    jobEntity, finalInclude, finalExclude);
                        } finally {
                            inFlight.decrementAndGet();
                        }
                    });
                } else {
                    try {
                        Thread.sleep(15);
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }

            workerPool.shutdown();
            workerPool.awaitTermination(5, TimeUnit.SECONDS);

            // Final status check & non-null error explanation if 0 pages were crawled
            if (job.getPages().isEmpty()) {
                job.setStatus("FAILED");
                if (!job.getSkipped().isEmpty()) {
                    CrawlAttempt firstAttempt = job.getSkipped().get(0);
                    String reason = firstAttempt.getReason();
                    if (reason == null || reason.isBlank()) {
                        reason = "Crawl failed with outcome: " + firstAttempt.getOutcome();
                    }
                    job.setErrorMessage(reason);
                } else if (job.getErrorMessage() == null) {
                    job.setErrorMessage("Crawl completed without extracting any valid HTML pages.");
                }
                crawlStreamService.emit(job.getJobId(), "job.failed", job);
            } else if ("RUNNING".equals(job.getStatus())) {
                job.setStatus("COMPLETED");
                crawlStreamService.emit(job.getJobId(), "job.completed", job);
            }
        } catch (Exception e) {
            log.error("Crawl job failed: {}", e.getMessage(), e);
            job.setStatus("FAILED");
            job.setErrorMessage(e.getMessage());
            crawlStreamService.emit(job.getJobId(), "job.failed", job);
        } finally {
            workerPool.shutdownNow();
            crawlStreamService.complete(job.getJobId());
            rateLimiterService.decrementActiveJob(clientIp);
            job.setEndTime(System.currentTimeMillis());

            // Final update in Neon PostgreSQL
            if (jobEntity != null) {
                try {
                    jobEntity.setStatus(job.getStatus());
                    jobEntity.setEndTime(job.getEndTime());
                    jobEntity.setErrorMessage(job.getErrorMessage());
                    jobEntity.setPagesCrawled(job.getPages().size());
                    jobEntity.setDiscoveredUrlsCount(job.getDiscoveredUrlsCount());
                    crawlJobRepository.save(jobEntity);
                } catch (Exception ex) {
                    log.warn("Failed to update final status in DB: {}", ex.getMessage());
                }
            }

            log.info("Finished crawl job {}. Status: {}, Crawled {} pages, Skipped {} attempts.",
                    job.getJobId(), job.getStatus(), job.getPages().size(), job.getSkipped().size());
        }
    }

    private void processUrl(CrawlTask current, CrawlJob job, String targetHost, CrawlRequest request,
                            Queue<CrawlTask> queue, Set<String> visited, Set<String> discovered,
                            CrawlJobEntity jobEntity, Pattern includeRegex, Pattern excludeRegex) {
        String currentUrl = current.url;

        // SSRF Check before connection
        try {
            urlSecurityValidator.validateUrl(currentUrl);
        } catch (Exception e) {
            log.warn("Blocked URL due to security validation: {} - {}", currentUrl, e.getMessage());
            CrawlAttempt attempt = new CrawlAttempt(currentUrl, "SSRF_BLOCKED", null, "Blocked by security policy: " + e.getMessage(), 0);
            job.addSkipped(attempt);
            crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
            return;
        }

        // Robots.txt check
        if (!robotsTxtService.isAllowed(currentUrl, job.isIgnoreRobotsTxt())) {
            log.info("Disallowed by robots.txt: {}", currentUrl);
            CrawlAttempt attempt = new CrawlAttempt(currentUrl, "ROBOTS_DISALLOWED", null, "Disallowed by robots.txt rules", 0);
            job.addSkipped(attempt);
            crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
            return;
        }

        long attemptStart = System.currentTimeMillis();
        try {
            Connection conn = Jsoup.connect(currentUrl)
                    .userAgent(RobotsTxtService.USER_AGENT)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Accept-Encoding", "gzip, deflate, br")
                    .timeout(10000)
                    .followRedirects(true)
                    .ignoreHttpErrors(true);

            if (current.parentUrl != null && !current.parentUrl.isEmpty()) {
                conn.header("Referer", current.parentUrl);
            }

            Connection.Response response = conn.execute();
            long duration = System.currentTimeMillis() - attemptStart;
            int statusCode = response.statusCode();
            String rawContentType = response.contentType();
            String contentType = rawContentType != null ? rawContentType.toLowerCase(Locale.ROOT) : "";

            // Validate HTML content type
            if (!contentType.contains("text/html") && !contentType.contains("application/xhtml+xml")) {
                log.info("Skipping non-HTML content for {}: {}", currentUrl, rawContentType);
                CrawlAttempt attempt = new CrawlAttempt(currentUrl, "NON_HTML", statusCode,
                        "Non-HTML content type: " + (rawContentType != null ? rawContentType : "unknown"), duration);
                job.addSkipped(attempt);
                crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
                return;
            }

            Document doc = response.parse();
            String title = doc.title() != null ? doc.title().trim() : "";
            if (title.isEmpty()) {
                title = currentUrl;
            }

            String bodyText = doc.text();
            int roughWordCount = bodyText.isBlank() ? 0 : bodyText.split("\\s+").length;

            // Detect Bot Protection / Cloudflare Interstitial
            if (isBotProtectionPage(statusCode, bodyText, title, roughWordCount)) {
                String warning = extractHost(currentUrl) + " is protected by bot detection. The crawler identified itself as a bot and was blocked.";
                log.warn("Bot protection triggered on {}: {}", currentUrl, warning);
                CrawlAttempt attempt = new CrawlAttempt(currentUrl, "BLOCKED_BY_BOT_PROTECTION", statusCode, warning, duration);
                job.addSkipped(attempt);
                crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
                return;
            }

            // Check for HTTP errors
            if (statusCode >= 400) {
                String outcome = (statusCode >= 500) ? "HTTP_ERROR_5XX" : "HTTP_ERROR_4XX";
                CrawlAttempt attempt = new CrawlAttempt(currentUrl, outcome, statusCode, "HTTP " + statusCode + ": " + response.statusMessage(), duration);
                job.addSkipped(attempt);
                crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
                return;
            }

            // Extract meta description
            Element metaDesc = doc.selectFirst("meta[name=description], meta[property=og:description]");
            String description = (metaDesc != null && metaDesc.hasAttr("content")) ? metaDesc.attr("content").trim() : "";

            // Strip noise for clean text extraction
            Document contentDoc = doc.clone();
            contentDoc.select("script, style, noscript, svg, nav, footer, header, form, iframe, button").remove();

            // Extract headings
            List<String> headings = new ArrayList<>();
            for (Element h : contentDoc.select("h1, h2, h3")) {
                String text = h.text().trim();
                if (!text.isEmpty() && headings.size() < 30) {
                    headings.add(h.tagName().toUpperCase() + ": " + text);
                }
            }

            // Extract structured content blocks & formatted readable text
            List<ContentBlock> structuredBlocks = new ArrayList<>();
            StringBuilder formattedText = new StringBuilder();
            int totalWords = 0;
            Set<String> seenTexts = new HashSet<>();

            Elements contentElements = contentDoc.select("h1, h2, h3, h4, p, li, blockquote, pre");
            for (Element el : contentElements) {
                String text = el.text().trim();
                if (text.isEmpty() || text.length() < 3) continue;
                if (!seenTexts.add(text)) continue;

                String tag = el.tagName().toLowerCase(Locale.ROOT);
                String type;
                if (tag.startsWith("h")) {
                    type = "HEADING";
                    int level = 1;
                    try { level = Integer.parseInt(tag.substring(1)); } catch (Exception ignored) {}
                    formattedText.append("\n\n").append("#".repeat(level)).append(" ").append(text).append("\n");
                } else if ("li".equals(tag)) {
                    type = "LIST_ITEM";
                    formattedText.append("\n• ").append(text);
                } else if ("blockquote".equals(tag)) {
                    type = "QUOTE";
                    formattedText.append("\n> ").append(text).append("\n");
                } else if ("pre".equals(tag)) {
                    type = "CODE";
                    formattedText.append("\n```\n").append(text).append("\n```\n");
                } else {
                    type = "PARAGRAPH";
                    formattedText.append("\n\n").append(text);
                }

                totalWords += text.split("\\s+").length;
                structuredBlocks.add(new ContentBlock(tag, type, text));
                if (structuredBlocks.size() >= 120) break;
            }

            String textContent = formattedText.toString().trim();
            if (textContent.isEmpty() && contentDoc.body() != null) {
                textContent = contentDoc.body().text();
                totalWords = textContent.split("\\s+").length;
            }

            // Extract links & normalize
            List<String> links = new ArrayList<>();
            for (Element a : doc.select("a[href]")) {
                String absHref = a.attr("abs:href");
                if (isValidHttpUrl(absHref)) {
                    String cleanHref = request.isUrlNormalization()
                            ? urlNormalizer.normalize(absHref)
                            : stripFragment(absHref);

                    links.add(cleanHref);

                    // Scope checking
                    if (request.isSameDomainOnly() && !isSameHost(targetHost, cleanHref)) {
                        continue;
                    }

                    if (includeRegex != null && !includeRegex.matcher(cleanHref).find()) {
                        continue;
                    }

                    if (excludeRegex != null && excludeRegex.matcher(cleanHref).find()) {
                        continue;
                    }

                    if (discovered.add(cleanHref)) {
                        job.setDiscoveredUrlsCount(discovered.size());
                        crawlStreamService.emit(job.getJobId(), "url.discovered",
                                Map.of("url", cleanHref, "discoveredCount", discovered.size()));

                        if (current.depth < job.getMaxDepth()
                                && !visited.contains(cleanHref)
                                && discovered.size() < job.getMaxPages() * 8) {
                            try {
                                urlSecurityValidator.validateUrl(cleanHref);
                                queue.offer(new CrawlTask(cleanHref, current.depth + 1, currentUrl));
                            } catch (Exception e) {
                                log.warn("Blocked discovered link: {} ({})", cleanHref, e.getMessage());
                            }
                        }
                    } else {
                        job.incrementDuplicatesSkipped();
                    }
                }
            }

            // Extract images
            List<String> images = new ArrayList<>();
            for (Element img : doc.select("img[src]")) {
                String absSrc = img.attr("abs:src");
                if (absSrc != null && !absSrc.trim().isEmpty() && images.size() < 30) {
                    images.add(absSrc.trim());
                }
            }

            PageData pageData = new PageData(
                    currentUrl,
                    title,
                    description,
                    statusCode,
                    headings,
                    textContent,
                    structuredBlocks,
                    totalWords,
                    links,
                    images
            );

            job.addPage(pageData);

            // Stream page crawled & progress
            crawlStreamService.emit(job.getJobId(), "page.crawled", pageData);
            crawlStreamService.emit(job.getJobId(), "progress", Map.of(
                    "pagesCrawled", job.getPages().size(),
                    "maxPages", job.getMaxPages(),
                    "discoveredCount", job.getDiscoveredUrlsCount(),
                    "duplicatesSkipped", job.getDuplicatesSkippedCount()
            ));

            // Persist page to Neon PostgreSQL
            if (jobEntity != null) {
                try {
                    PageDataEntity pageEntity = toEntity(pageData, jobEntity);
                    pageDataRepository.save(pageEntity);
                    jobEntity.setPagesCrawled(job.getPages().size());
                    jobEntity.setDiscoveredUrlsCount(job.getDiscoveredUrlsCount());
                    crawlJobRepository.save(jobEntity);
                } catch (Exception ex) {
                    log.warn("Failed to persist page to DB: {}", ex.getMessage());
                }
            }

            log.info("[{}/{}] Crawled: {} ({} words)", job.getPages().size(), job.getMaxPages(), currentUrl, totalWords);

        } catch (SocketTimeoutException e) {
            long duration = System.currentTimeMillis() - attemptStart;
            CrawlAttempt attempt = new CrawlAttempt(currentUrl, "TIMEOUT", null, "Request timed out: " + e.getMessage(), duration);
            job.addSkipped(attempt);
            crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
        } catch (UnknownHostException e) {
            long duration = System.currentTimeMillis() - attemptStart;
            CrawlAttempt attempt = new CrawlAttempt(currentUrl, "DNS_FAILURE", null, "DNS resolution failed: " + e.getMessage(), duration);
            job.addSkipped(attempt);
            crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
        } catch (ConnectException e) {
            long duration = System.currentTimeMillis() - attemptStart;
            CrawlAttempt attempt = new CrawlAttempt(currentUrl, "CONNECTION_REFUSED", null, "Connection refused: " + e.getMessage(), duration);
            job.addSkipped(attempt);
            crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
        } catch (SSLException e) {
            long duration = System.currentTimeMillis() - attemptStart;
            CrawlAttempt attempt = new CrawlAttempt(currentUrl, "TLS_ERROR", null, "SSL/TLS handshake failed: " + e.getMessage(), duration);
            job.addSkipped(attempt);
            crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
        } catch (HttpStatusException e) {
            long duration = System.currentTimeMillis() - attemptStart;
            int code = e.getStatusCode();
            String outcome = (code >= 500) ? "HTTP_ERROR_5XX" : "HTTP_ERROR_4XX";
            CrawlAttempt attempt = new CrawlAttempt(currentUrl, outcome, code, "HTTP " + code + ": " + e.getMessage(), duration);
            job.addSkipped(attempt);
            crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - attemptStart;
            CrawlAttempt attempt = new CrawlAttempt(currentUrl, "PARSE_ERROR", null, "Failed to fetch: " + e.getMessage(), duration);
            job.addSkipped(attempt);
            crawlStreamService.emit(job.getJobId(), "url.skipped", attempt);
        }

        // Courtesy pause (honour robots.txt crawl-delay if present)
        Integer customDelay = robotsTxtService.getCrawlDelay(targetHost);
        long delayMs = (customDelay != null && customDelay > 0) ? customDelay * 1000L : 50L;
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }

    private boolean isBotProtectionPage(int statusCode, String bodyText, String title, int wordCount) {
        if (statusCode == 403 || statusCode == 429 || statusCode == 503) {
            if (wordCount < 25) {
                return true;
            }
        }
        if (statusCode >= 400 && wordCount < 5) {
            return true;
        }
        String combined = (bodyText + " " + title).toLowerCase(Locale.ROOT);
        for (String marker : BOT_CHALLENGE_MARKERS) {
            if (combined.contains(marker.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private PageDataEntity toEntity(PageData dto, CrawlJobEntity jobEntity) {
        PageDataEntity entity = new PageDataEntity();
        entity.setJob(jobEntity);
        entity.setUrl(dto.getUrl());
        entity.setTitle(dto.getTitle());
        entity.setDescription(dto.getDescription());
        entity.setStatusCode(dto.getStatusCode());
        entity.setWordCount(dto.getWordCount());
        entity.setTextContent(dto.getTextContent());
        entity.setCrawlTimestamp(dto.getCrawlTimestamp());

        try {
            entity.setHeadingsJson(objectMapper.writeValueAsString(dto.getHeadings()));
            entity.setStructuredContentJson(objectMapper.writeValueAsString(dto.getStructuredContent()));
            entity.setLinksJson(objectMapper.writeValueAsString(dto.getLinks()));
            entity.setImagesJson(objectMapper.writeValueAsString(dto.getImages()));
        } catch (Exception ignored) {
        }
        return entity;
    }

    private PageData toDto(PageDataEntity entity) {
        PageData dto = new PageData();
        dto.setUrl(entity.getUrl());
        dto.setTitle(entity.getTitle());
        dto.setDescription(entity.getDescription());
        dto.setStatusCode(entity.getStatusCode());
        dto.setWordCount(entity.getWordCount());
        dto.setTextContent(entity.getTextContent());
        dto.setCrawlTimestamp(entity.getCrawlTimestamp());

        try {
            if (entity.getHeadingsJson() != null) {
                dto.setHeadings(objectMapper.readValue(entity.getHeadingsJson(), new TypeReference<List<String>>() {}));
            }
            if (entity.getStructuredContentJson() != null) {
                dto.setStructuredContent(objectMapper.readValue(entity.getStructuredContentJson(), new TypeReference<List<ContentBlock>>() {}));
            }
            if (entity.getLinksJson() != null) {
                dto.setLinks(objectMapper.readValue(entity.getLinksJson(), new TypeReference<List<String>>() {}));
            }
            if (entity.getImagesJson() != null) {
                dto.setImages(objectMapper.readValue(entity.getImagesJson(), new TypeReference<List<String>>() {}));
            }
        } catch (Exception ignored) {
        }
        return dto;
    }

    private CrawlJob toDto(CrawlJobEntity entity) {
        CrawlJob dto = new CrawlJob(entity.getJobId(), entity.getStartUrl(), entity.getMaxPages(), entity.getMaxDepth());
        dto.setStatus(entity.getStatus());
        dto.setPagesCrawled(entity.getPagesCrawled());
        dto.setDiscoveredUrlsCount(entity.getDiscoveredUrlsCount());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setErrorMessage(entity.getErrorMessage());

        if (entity.getPages() != null) {
            for (PageDataEntity p : entity.getPages()) {
                dto.addPage(toDto(p));
            }
        }
        return dto;
    }

    private String extractHost(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (host != null && host.startsWith("www.")) {
                return host.substring(4);
            }
            return host != null ? host : "";
        } catch (Exception e) {
            return "";
        }
    }

    private boolean isSameHost(String targetHost, String url) {
        if (targetHost == null || targetHost.isEmpty()) {
            return true;
        }
        String host = extractHost(url);
        return host.equalsIgnoreCase(targetHost) || host.endsWith("." + targetHost);
    }

    private boolean isValidHttpUrl(String url) {
        return url != null && (url.startsWith("http://") || url.startsWith("https://"));
    }

    private String stripFragment(String url) {
        int hashIdx = url.indexOf('#');
        return hashIdx != -1 ? url.substring(0, hashIdx) : url;
    }

    private record CrawlTask(String url, int depth, String parentUrl) {}
}
