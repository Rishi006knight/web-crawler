package com.ssn.webcrawler.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Service for politeness rate limiting and per-domain concurrency control.
 * Uses Redis timestamps to coordinate delay across threads and jobs.
 */
@Service
public class PolitenessRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(PolitenessRateLimiter.class);
    private static final String LAST_REQ_PREFIX = "crawler:domain:lastreq:";
    private static final String ACTIVE_REQ_PREFIX = "crawler:domain:active:";

    private final RedisTemplate<String, String> redisTemplate;
    private final ConcurrentHashMap<String, Semaphore> domainSemaphores = new ConcurrentHashMap<>();

    @Value("${crawler.domain-delay-ms:500}")
    private long defaultDomainDelayMs;

    @Value("${crawler.per-domain-concurrency:2}")
    private int maxPerDomainConcurrency;

    public PolitenessRateLimiter(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Enforces politeness delay before requesting the given URL.
     * Takes robots.txt crawl delay into account if higher than the default delay.
     */
    public void acquirePoliteAccess(String urlString, long robotsCrawlDelayMs) {
        String domain = extractDomain(urlString);
        if (domain == null) return;

        // 1. Concurrency limit per domain
        Semaphore semaphore = domainSemaphores.computeIfAbsent(domain, d -> new Semaphore(maxPerDomainConcurrency, true));
        try {
            semaphore.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // 2. Delay enforcement across jobs/threads via Redis timestamp
        long requiredDelay = Math.max(defaultDomainDelayMs, robotsCrawlDelayMs);
        String lastReqKey = LAST_REQ_PREFIX + domain.toLowerCase();

        try {
            String lastReqStr = redisTemplate.opsForValue().get(lastReqKey);
            long now = System.currentTimeMillis();
            if (lastReqStr != null) {
                long lastReqTime = Long.parseLong(lastReqStr);
                long elapsed = now - lastReqTime;
                if (elapsed < requiredDelay) {
                    long sleepMs = requiredDelay - elapsed;
                    log.debug("Politeness delay for domain {}: sleeping {} ms", domain, sleepMs);
                    try {
                        Thread.sleep(sleepMs);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
            redisTemplate.opsForValue().set(lastReqKey, String.valueOf(System.currentTimeMillis()), Duration.ofMinutes(10));
        } catch (Exception e) {
            log.debug("Politeness check fallback: {}", e.getMessage());
        }
    }

    /**
     * Release per-domain concurrency slot after request finishes.
     */
    public void releaseAccess(String urlString) {
        String domain = extractDomain(urlString);
        if (domain == null) return;
        Semaphore semaphore = domainSemaphores.get(domain);
        if (semaphore != null) {
            semaphore.release();
        }
    }

    private String extractDomain(String urlString) {
        try {
            URI uri = new URI(urlString);
            return uri.getHost();
        } catch (Exception e) {
            return null;
        }
    }
}
