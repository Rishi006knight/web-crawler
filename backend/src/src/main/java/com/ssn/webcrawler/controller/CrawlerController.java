package com.ssn.webcrawler.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssn.webcrawler.model.CrawlRequest;
import com.ssn.webcrawler.model.CrawlResult;
import com.ssn.webcrawler.model.CrawlerStats;
import com.ssn.webcrawler.service.CrawlerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class CrawlerController {

    private final CrawlerService crawlerService;
    private final ObjectMapper objectMapper;

    public CrawlerController(CrawlerService crawlerService, ObjectMapper objectMapper) {
        this.crawlerService = crawlerService;
        this.objectMapper = objectMapper;
    }

    /** Start a new crawl job. Returns 202 Accepted immediately with a jobId. */
    @PostMapping("/crawl")
    public ResponseEntity<CrawlResult> startCrawl(@Valid @RequestBody CrawlRequest request) {
        CrawlResult result = crawlerService.startCrawl(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(result);
    }

    /** Poll job status / final result. */
    @GetMapping("/crawl/{jobId}")
    public ResponseEntity<CrawlResult> getJob(@PathVariable String jobId) {
        return ResponseEntity.ok(crawlerService.getJob(jobId));
    }

    /** List all jobs (for dashboards / history). */
    @GetMapping("/crawl")
    public ResponseEntity<Collection<CrawlResult>> getAllJobs() {
        return ResponseEntity.ok(crawlerService.getAllJobs());
    }

    /** Clear the Redis visited-set and queue for a job. */
    @DeleteMapping("/crawl/{jobId}/cache")
    public ResponseEntity<Void> clearCache(@PathVariable String jobId) {
        crawlerService.clearCache(jobId);
        return ResponseEntity.noContent().build();
    }

    /** Delete a job record and its cache completely. */
    @DeleteMapping("/crawl/{jobId}")
    public ResponseEntity<Void> deleteJob(@PathVariable String jobId) {
        crawlerService.deleteJob(jobId);
        return ResponseEntity.noContent().build();
    }

    /** Export crawl results as CSV or JSON file download. */
    @GetMapping("/crawl/{jobId}/export")
    public ResponseEntity<?> exportJob(
            @PathVariable String jobId,
            @RequestParam(defaultValue = "csv") String format) {

        CrawlResult job = crawlerService.getJob(jobId);

        if ("json".equalsIgnoreCase(format)) {
            try {
                byte[] jsonBytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(job);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"crawl-" + jobId + ".json\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(jsonBytes);
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error exporting JSON: " + e.getMessage());
            }
        } else {
            String csvData = crawlerService.exportCsv(jobId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"crawl-" + jobId + ".csv\"")
                    .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                    .body(csvData);
        }
    }

    /** Global aggregate statistics across all crawls. */
    @GetMapping("/stats")
    public ResponseEntity<CrawlerStats> getStats() {
        return ResponseEntity.ok(crawlerService.getStats());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(java.util.NoSuchElementException.class)
    public ResponseEntity<String> handleNotFound(java.util.NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
