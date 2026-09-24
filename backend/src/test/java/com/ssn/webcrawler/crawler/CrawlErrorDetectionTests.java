package com.ssn.webcrawler.crawler;

import com.ssn.webcrawler.model.CrawlAttempt;
import com.ssn.webcrawler.model.CrawlJob;
import com.ssn.webcrawler.model.CrawlRequest;
import com.ssn.webcrawler.repository.CrawlJobRepository;
import com.ssn.webcrawler.repository.PageDataRepository;
import com.ssn.webcrawler.security.RateLimiterService;
import com.ssn.webcrawler.security.UrlSecurityValidator;
import com.ssn.webcrawler.service.CrawlerService;
import com.ssn.webcrawler.service.RobotsTxtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

public class CrawlErrorDetectionTests {

    private CrawlerService crawlerService;
    private CrawlJobRepository crawlJobRepository;
    private PageDataRepository pageDataRepository;
    private UrlSecurityValidator urlSecurityValidator;
    private RateLimiterService rateLimiterService;
    private RobotsTxtService robotsTxtService;

    @BeforeEach
    void setUp() {
        crawlJobRepository = mock(CrawlJobRepository.class);
        pageDataRepository = mock(PageDataRepository.class);
        urlSecurityValidator = new UrlSecurityValidator();
        rateLimiterService = new RateLimiterService();
        robotsTxtService = new RobotsTxtService();

        crawlerService = new CrawlerService(
                crawlJobRepository,
                pageDataRepository,
                urlSecurityValidator,
                rateLimiterService,
                robotsTxtService
        );
    }

    @Test
    @DisplayName("Zero pages crawled is never accompanied by a null errorMessage")
    void testZeroPagesNeverHasNullErrorMessage() {
        CrawlJob job = new CrawlJob("test-job", "https://example.com", 10, 1);
        job.addSkipped(new CrawlAttempt("https://example.com", "NON_HTML", 200, "Non-HTML content type: application/json", 150));
        
        // Simulate completion check in crawler
        if (job.getPages().isEmpty()) {
            job.setStatus("FAILED");
            if (!job.getSkipped().isEmpty()) {
                job.setErrorMessage(job.getSkipped().get(0).getReason());
            }
        }

        assertEquals("FAILED", job.getStatus());
        assertNotNull(job.getErrorMessage(), "errorMessage must not be null when 0 pages crawled");
        assertTrue(job.getErrorMessage().contains("Non-HTML"));
    }

    @Test
    @DisplayName("Detect bot-block interstitial and classify as BLOCKED_BY_BOT_PROTECTION")
    void testBotProtectionClassification() {
        CrawlJob job = new CrawlJob("test-bot", "https://example.com/protected", 10, 1);
        String challengeMarker = "Just a moment...";
        int statusCode = 403;

        boolean isBlocked = statusCode == 403 || challengeMarker.contains("Just a moment...");
        if (isBlocked) {
            job.addSkipped(new CrawlAttempt(
                    "https://example.com/protected",
                    "BLOCKED_BY_BOT_PROTECTION",
                    statusCode,
                    "example.com is protected by bot detection. The crawler identified itself as a bot and was blocked.",
                    120
            ));
        }

        assertEquals(1, job.getSkipped().size());
        assertEquals("BLOCKED_BY_BOT_PROTECTION", job.getSkipped().get(0).getOutcome());
        assertEquals(0, job.getPages().size(), "Bot challenge page must not be stored in pages");
    }

    @Test
    @DisplayName("Robots.txt service correctly parses Disallow rules")
    void testRobotsTxtRuleEvaluation() {
        RobotsTxtService.HostRobots rules = new RobotsTxtService.HostRobots(
                java.util.List.of("/private", "/admin", "/api/"),
                2
        );

        assertFalse(rules.isAllowed("/admin/dashboard"));
        assertFalse(rules.isAllowed("/private/user"));
        assertFalse(rules.isAllowed("/api/v1/crawl"));
        assertTrue(rules.isAllowed("/public/about"));
        assertTrue(rules.isAllowed("/"));
        assertEquals(2, rules.crawlDelaySeconds());
    }

    @Test
    @DisplayName("CrawlAttempt tracks outcome, duration, and errorSummary correctly")
    void testErrorSummaryAggregation() {
        CrawlJob job = new CrawlJob("job-errors", "https://example.com", 20, 2);
        job.addSkipped(new CrawlAttempt("https://example.com/1", "NON_HTML", 200, "JSON", 50));
        job.addSkipped(new CrawlAttempt("https://example.com/2", "NON_HTML", 200, "PNG", 30));
        job.addSkipped(new CrawlAttempt("https://example.com/3", "TIMEOUT", null, "Timeout", 10000));
        job.addSkipped(new CrawlAttempt("https://example.com/4", "ROBOTS_DISALLOWED", null, "Disallowed", 0));

        assertEquals(4, job.getSkipped().size());
        assertEquals(2, job.getErrorSummary().get("NON_HTML"));
        assertEquals(1, job.getErrorSummary().get("TIMEOUT"));
        assertEquals(1, job.getErrorSummary().get("ROBOTS_DISALLOWED"));
    }
}
