package com.ssn.webcrawler.controller;

import com.ssn.webcrawler.model.CrawlJob;
import com.ssn.webcrawler.model.CrawlRequest;
import com.ssn.webcrawler.model.PageData;
import com.ssn.webcrawler.security.RateLimiterService;
import com.ssn.webcrawler.security.UrlSecurityValidator;
import com.ssn.webcrawler.service.CrawlerService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class CrawlerController {

    private final CrawlerService crawlerService;
    private final UrlSecurityValidator urlSecurityValidator;
    private final RateLimiterService rateLimiterService;

    public CrawlerController(CrawlerService crawlerService,
                             UrlSecurityValidator urlSecurityValidator,
                             RateLimiterService rateLimiterService) {
        this.crawlerService = crawlerService;
        this.urlSecurityValidator = urlSecurityValidator;
        this.rateLimiterService = rateLimiterService;
    }

    @PostMapping("/crawl")
    public ResponseEntity<?> startCrawl(@RequestBody CrawlRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        try {
            // 1. URL validation & presence check
            String rawUrl = request.getUrl();
            if (rawUrl == null || rawUrl.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
            }

            // 2. Validate URL against SSRF, internal networks, cloud metadata, schemes
            urlSecurityValidator.validateUrl(rawUrl);

            // 3. Clamp inputs (maxPages: 1..500, maxDepth: 1..5)
            if (request.getMaxPages() != null) {
                if (request.getMaxPages() < 1 || request.getMaxPages() > 500) {
                    return ResponseEntity.badRequest().body(Map.of("error", "maxPages must be between 1 and 500"));
                }
            }

            if (request.getMaxDepth() != null) {
                if (request.getMaxDepth() < 1 || request.getMaxDepth() > 5) {
                    return ResponseEntity.badRequest().body(Map.of("error", "maxDepth must be between 1 and 5"));
                }
            }

            // 4. Rate Limiting and concurrent job caps
            RateLimiterService.RateLimitResult rateLimitResult = rateLimiterService.checkRateLimit(clientIp);
            if (!rateLimitResult.allowed()) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .header("Retry-After", String.valueOf(rateLimitResult.retryAfterSeconds()))
                        .body(Map.of(
                                "error", rateLimitResult.message(),
                                "retryAfter", rateLimitResult.retryAfterSeconds()
                        ));
            }

            // Start the crawl job
            CrawlJob job = crawlerService.startCrawl(request, clientIp);
            return ResponseEntity.ok(job);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process crawl request: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/crawl/{jobId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamJob(@PathVariable String jobId) {
        return crawlerService.subscribeToStream(jobId);
    }

    @GetMapping("/crawl/{jobId}")
    public ResponseEntity<?> getJobStatus(@PathVariable String jobId, @RequestParam(required = false) Integer since) {
        CrawlJob job = crawlerService.getJob(jobId);
        if (job == null) {
            return ResponseEntity.notFound().build();
        }
        if (since != null && since >= 0) {
            return ResponseEntity.ok(crawlerService.getJobSince(job, since));
        }
        return ResponseEntity.ok(job);
    }

    @GetMapping("/crawl/{jobId}/pages/{pageIndex}")
    public ResponseEntity<?> getPageDetails(@PathVariable String jobId, @PathVariable int pageIndex) {
        PageData page = crawlerService.getPageByIndex(jobId, pageIndex);
        if (page == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(page);
    }

    @GetMapping("/crawl/{jobId}/search")
    public ResponseEntity<?> searchJobPages(@PathVariable String jobId, @RequestParam(name = "q", defaultValue = "") String query) {
        return ResponseEntity.ok(crawlerService.searchPages(jobId, query));
    }

    @GetMapping("/crawl/latest")
    public ResponseEntity<?> getLatestJob() {
        CrawlJob job = crawlerService.getLatestJob();
        if (job == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(job);
    }

    @PostMapping("/crawl/{jobId}/stop")
    public ResponseEntity<?> stopCrawl(@PathVariable String jobId) {
        boolean stopped = crawlerService.stopJob(jobId);
        return ResponseEntity.ok(Map.of("jobId", jobId, "stopped", stopped));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "Web Crawler"));
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String xReal = request.getHeader("X-Real-IP");
        if (xReal != null && !xReal.isBlank()) {
            return xReal.trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
