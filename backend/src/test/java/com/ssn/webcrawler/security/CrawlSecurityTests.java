package com.ssn.webcrawler.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssn.webcrawler.controller.CrawlerController;
import com.ssn.webcrawler.model.CrawlJob;
import com.ssn.webcrawler.model.CrawlRequest;
import com.ssn.webcrawler.service.CrawlerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.net.InetAddress;
import java.net.UnknownHostException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class CrawlSecurityTests {

    private MockMvc mockMvc;
    private UrlSecurityValidator validator;
    private RateLimiterService rateLimiterService;
    private CrawlerService crawlerService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        validator = new UrlSecurityValidator();
        rateLimiterService = new RateLimiterService();
        crawlerService = Mockito.mock(CrawlerService.class);
        objectMapper = new ObjectMapper();

        CrawlerController controller = new CrawlerController(crawlerService, validator, rateLimiterService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("Reject localhost:8080 with HTTP 400")
    void testRejectLocalhost() throws Exception {
        CrawlRequest request = new CrawlRequest("http://localhost:8080", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Reject 127.0.0.1:8080 with HTTP 400")
    void testRejectIPv4Loopback() throws Exception {
        CrawlRequest request = new CrawlRequest("http://127.0.0.1:8080", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Reject [::1]:8080 with HTTP 400")
    void testRejectIPv6Loopback() throws Exception {
        CrawlRequest request = new CrawlRequest("http://[::1]:8080", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Reject AWS/GCP cloud metadata IP 169.254.169.254 with HTTP 400")
    void testRejectCloudMetadataIp() throws Exception {
        CrawlRequest request = new CrawlRequest("http://169.254.169.254/latest/meta-data/", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Reject metadata.google.internal with HTTP 400")
    void testRejectGcpMetadataHostname() throws Exception {
        CrawlRequest request = new CrawlRequest("http://metadata.google.internal/computeMetadata/v1/", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Reject file:///etc/passwd with HTTP 400")
    void testRejectFileScheme() throws Exception {
        CrawlRequest request = new CrawlRequest("file:///etc/passwd", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Reject 10.0.0.5 and 192.168.1.1 private RFC 1918 IPs with HTTP 400")
    void testRejectPrivateIps() throws Exception {
        CrawlRequest request1 = new CrawlRequest("http://10.0.0.5/", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());

        CrawlRequest request2 = new CrawlRequest("http://192.168.1.1/", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Reject malformed 'not a url' with HTTP 400")
    void testRejectNotAUrl() throws Exception {
        CrawlRequest request = new CrawlRequest("not a url", 20, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Reject maxPages 999999 with HTTP 400")
    void testRejectExcessiveMaxPages() throws Exception {
        CrawlRequest request = new CrawlRequest("https://example.com", 999999, 2);
        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("maxPages must be between 1 and 500"));
    }

    @Test
    @DisplayName("Accept valid public URL https://example.com with HTTP 200")
    void testAcceptValidPublicUrl() throws Exception {
        CrawlRequest request = new CrawlRequest("https://example.com", 20, 2);
        CrawlJob mockJob = new CrawlJob("job-123", "https://example.com", 20, 2);
        when(crawlerService.startCrawl(any(), any())).thenReturn(mockJob);

        mockMvc.perform(post("/api/crawl")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobId").value("job-123"))
                .andExpect(jsonPath("$.startUrl").value("https://example.com"));
    }

    @Test
    @DisplayName("Reject hostname resolving to both public and private IP (DNS rebinding)")
    void testRejectDnsRebinding() {
        DnsResolver splitBrainResolver = host -> new InetAddress[]{
                InetAddress.getByAddress(new byte[]{93, (byte) 184, (byte) 216, 34}), // public example.com
                InetAddress.getByAddress(new byte[]{127, 0, 0, 1})                     // loopback!
        };

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                validator.validateUrl("http://split-brain.test", splitBrainResolver)
        );
        assertTrue(ex.getMessage().contains("internal or private IP address is prohibited"));
    }

    @Test
    @DisplayName("Enforce rate limit of 5 requests per 10 minutes with HTTP 429 and Retry-After header")
    void testRateLimiting() throws Exception {
        CrawlRequest request = new CrawlRequest("https://example.com", 20, 2);
        CrawlJob mockJob = new CrawlJob("job-test", "https://example.com", 20, 2);
        when(crawlerService.startCrawl(any(), any())).thenReturn(mockJob);

        // First 5 requests should succeed
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/crawl")
                            .header("X-Forwarded-For", "203.0.113.195")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        // 6th request from same IP must be rejected with 429 Too Many Requests
        mockMvc.perform(post("/api/crawl")
                        .header("X-Forwarded-For", "203.0.113.195")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.error").value("Rate limit exceeded. Maximum 5 crawl jobs allowed per 10 minutes."));
    }
}
