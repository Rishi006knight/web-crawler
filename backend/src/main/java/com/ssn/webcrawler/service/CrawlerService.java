package com.ssn.webcrawler.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssn.webcrawler.model.ContentBlock;
import com.ssn.webcrawler.model.CrawlJob;
import com.ssn.webcrawler.model.CrawlRequest;
import com.ssn.webcrawler.model.PageData;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.*;
import java.util.concurrent.*;

@Service
public class CrawlerService {

    private static final Logger log = LoggerFactory.getLogger(CrawlerService.class);

    private final ConcurrentHashMap<String, CrawlJob> jobs = new ConcurrentHashMap<>();
    private final ExecutorService crawlExecutor = Executors.newFixedThreadPool(4);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile String latestJobId = null;

    public CrawlJob startCrawl(CrawlRequest request) {
        String rawUrl = request.getUrl();
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Target URL cannot be empty");
        }

        String normalizedUrl = normalizeUrl(rawUrl.trim());
        String jobId = UUID.randomUUID().toString();
        int maxPages = request.getMaxPages();
        int maxDepth = request.getMaxDepth();

        CrawlJob job = new CrawlJob(jobId, normalizedUrl, maxPages, maxDepth);
        jobs.put(jobId, job);
        latestJobId = jobId;

        crawlExecutor.submit(() -> executeCrawl(job));
        return job;
    }

    public CrawlJob getJob(String jobId) {
        return jobs.get(jobId);
    }

    public CrawlJob getLatestJob() {
        if (latestJobId != null) {
            return jobs.get(latestJobId);
        }
        return null;
    }

    public boolean stopJob(String jobId) {
        CrawlJob job = jobs.get(jobId);
        if (job != null && "RUNNING".equals(job.getStatus())) {
            job.setStatus("STOPPED");
            job.setEndTime(System.currentTimeMillis());
            return true;
        }
        return false;
    }

    private void executeCrawl(CrawlJob job) {
        log.info("Starting crawl job {} for URL: {}", job.getJobId(), job.getStartUrl());
        String startUrl = job.getStartUrl();
        String targetHost = extractHost(startUrl);

        Queue<CrawlTask> queue = new ConcurrentLinkedQueue<>();
        Set<String> visited = ConcurrentHashMap.newKeySet();
        Set<String> discovered = ConcurrentHashMap.newKeySet();

        queue.offer(new CrawlTask(startUrl, 0));
        discovered.add(startUrl);
        job.setDiscoveredUrlsCount(1);

        try {
            while ("RUNNING".equals(job.getStatus()) && !queue.isEmpty() && job.getPages().size() < job.getMaxPages()) {
                CrawlTask current = queue.poll();
                if (current == null) {
                    break;
                }

                String currentUrl = current.url;
                if (visited.contains(currentUrl)) {
                    continue;
                }
                visited.add(currentUrl);

                try {
                    Connection.Response response = Jsoup.connect(currentUrl)
                            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 SimpleWebCrawler/1.0")
                            .timeout(7000)
                            .followRedirects(true)
                            .ignoreHttpErrors(true)
                            .execute();

                    int statusCode = response.statusCode();
                    String contentType = response.contentType();

                    // Only parse HTML content
                    if (contentType == null || !contentType.contains("text/html")) {
                        continue;
                    }

                    Document doc = response.parse();
                    String title = doc.title() != null ? doc.title().trim() : "";
                    if (title.isEmpty()) {
                        title = currentUrl;
                    }

                    // Extract meta description
                    Element metaDesc = doc.selectFirst("meta[name=description], meta[property=og:description]");
                    String description = (metaDesc != null && metaDesc.hasAttr("content")) ? metaDesc.attr("content").trim() : "";

                    // Clone document and strip noise for clean text extraction
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

                        String tag = el.tagName().toLowerCase();
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

                    // Extract links (from full doc so navigation is included for discovery)
                    List<String> links = new ArrayList<>();
                    for (Element a : doc.select("a[href]")) {
                        String absHref = a.attr("abs:href");
                        if (isValidHttpUrl(absHref)) {
                            String cleanHref = stripFragment(absHref);
                            links.add(cleanHref);
                            if (discovered.add(cleanHref)) {
                                job.setDiscoveredUrlsCount(discovered.size());
                            }

                            // If within the same host and depth allows, queue it
                            if (isSameHost(targetHost, cleanHref)
                                    && current.depth < job.getMaxDepth()
                                    && !visited.contains(cleanHref)
                                    && discovered.size() < job.getMaxPages() * 5) {
                                queue.offer(new CrawlTask(cleanHref, current.depth + 1));
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
                    log.info("[{}/{}] Crawled: {} ({} words, {} blocks)", 
                            job.getPages().size(), job.getMaxPages(), currentUrl, totalWords, structuredBlocks.size());

                } catch (Exception e) {
                    log.warn("Failed to fetch page: {} - {}", currentUrl, e.getMessage());
                }

                // Courtesy pause
                try {
                    Thread.sleep(150);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            }

            if ("RUNNING".equals(job.getStatus())) {
                job.setStatus("COMPLETED");
            }
        } catch (Exception e) {
            log.error("Crawl job failed: {}", e.getMessage(), e);
            job.setStatus("FAILED");
            job.setErrorMessage(e.getMessage());
        } finally {
            job.setEndTime(System.currentTimeMillis());
            log.info("Finished crawl job {}. Crawled {} pages, found {} links.",
                    job.getJobId(), job.getPages().size(), job.getDiscoveredUrlsCount());
        }
    }

    public String exportCsv(String jobId) {
        CrawlJob job = jobs.get(jobId);
        if (job == null) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("URL,Title,Description,Status,WordCount,HeadingsCount,StructuredBlocksCount,LinksCount,ImagesCount,Headings,StructuredText\n");

        for (PageData p : job.getPages()) {
            sb.append(escapeCsv(p.getUrl())).append(",");
            sb.append(escapeCsv(p.getTitle())).append(",");
            sb.append(escapeCsv(p.getDescription())).append(",");
            sb.append(p.getStatusCode()).append(",");
            sb.append(p.getWordCount()).append(",");
            sb.append(p.getHeadings().size()).append(",");
            sb.append(p.getStructuredContent().size()).append(",");
            sb.append(p.getLinks().size()).append(",");
            sb.append(p.getImages().size()).append(",");
            sb.append(escapeCsv(String.join(" | ", p.getHeadings()))).append(",");
            sb.append(escapeCsv(p.getTextContent())).append("\n");
        }

        return sb.toString();
    }

    public String exportJson(String jobId) {
        CrawlJob job = jobs.get(jobId);
        if (job == null) {
            return "{}";
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(job);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String escapeCsv(String field) {
        if (field == null) {
            return "\"\"";
        }
        return "\"" + field.replace("\"", "\"\"").replace("\n", " \n ").replace("\r", "") + "\"";
    }

    private String normalizeUrl(String url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return "https://" + url;
        }
        return url;
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

    private record CrawlTask(String url, int depth) {}
}
