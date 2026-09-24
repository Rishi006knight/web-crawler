package com.ssn.webcrawler.controller;

import com.ssn.webcrawler.model.CrawlJob;
import com.ssn.webcrawler.model.CrawlRequest;
import com.ssn.webcrawler.service.CrawlerService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CrawlerController {

    private final CrawlerService crawlerService;

    public CrawlerController(CrawlerService crawlerService) {
        this.crawlerService = crawlerService;
    }

    @PostMapping("/crawl")
    public ResponseEntity<?> startCrawl(@RequestBody CrawlRequest request) {
        try {
            if (request.getUrl() == null || request.getUrl().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
            }
            CrawlJob job = crawlerService.startCrawl(request);
            return ResponseEntity.ok(job);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/crawl/{jobId}")
    public ResponseEntity<?> getJobStatus(@PathVariable String jobId) {
        CrawlJob job = crawlerService.getJob(jobId);
        if (job == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(job);
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

    @GetMapping("/crawl/{jobId}/export")
    public ResponseEntity<byte[]> exportData(
            @PathVariable String jobId,
            @RequestParam(defaultValue = "csv") String format) {

        CrawlJob job = crawlerService.getJob(jobId);
        if (job == null) {
            return ResponseEntity.notFound().build();
        }

        if ("json".equalsIgnoreCase(format)) {
            String json = crawlerService.exportJson(jobId);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crawl-" + jobId.substring(0, 8) + ".json")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(bytes);
        } else {
            String csv = crawlerService.exportCsv(jobId);
            byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crawl-" + jobId.substring(0, 8) + ".csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(bytes);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "Simple Web Crawler"));
    }
}
