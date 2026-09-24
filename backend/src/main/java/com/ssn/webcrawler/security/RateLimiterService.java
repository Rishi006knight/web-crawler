package com.ssn.webcrawler.security;

import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimiterService {

    private static final int MAX_REQUESTS_PER_WINDOW = 5;
    private static final long WINDOW_MS = 10 * 60 * 1000L; // 10 minutes
    private static final int MAX_GLOBAL_CONCURRENT_JOBS = 5;
    private static final int MAX_PER_IP_CONCURRENT_JOBS = 2;

    private final Map<String, Deque<Long>> ipRequestWindows = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> ipActiveJobs = new ConcurrentHashMap<>();
    private final AtomicInteger globalActiveJobs = new AtomicInteger(0);

    public record RateLimitResult(boolean allowed, int retryAfterSeconds, String message) {}

    public synchronized RateLimitResult checkRateLimit(String clientIp) {
        long now = System.currentTimeMillis();

        // 1. Check concurrent jobs globally
        if (globalActiveJobs.get() >= MAX_GLOBAL_CONCURRENT_JOBS) {
            return new RateLimitResult(false, 30, "System is currently busy. Maximum concurrent crawl jobs reached.");
        }

        // 2. Check concurrent jobs per IP
        AtomicInteger activeForIp = ipActiveJobs.computeIfAbsent(clientIp, k -> new AtomicInteger(0));
        if (activeForIp.get() >= MAX_PER_IP_CONCURRENT_JOBS) {
            return new RateLimitResult(false, 30, "You already have the maximum number of concurrent crawl jobs running.");
        }

        // 3. Sliding window per-IP limit (5 jobs / 10 minutes)
        Deque<Long> timestamps = ipRequestWindows.computeIfAbsent(clientIp, k -> new ArrayDeque<>());
        while (!timestamps.isEmpty() && (now - timestamps.peekFirst() > WINDOW_MS)) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= MAX_REQUESTS_PER_WINDOW) {
            long oldest = timestamps.peekFirst();
            long waitMs = (oldest + WINDOW_MS) - now;
            int retryAfter = (int) Math.max(1, (waitMs + 999) / 1000);
            return new RateLimitResult(false, retryAfter, "Rate limit exceeded. Maximum 5 crawl jobs allowed per 10 minutes.");
        }

        // Record this request
        timestamps.addLast(now);
        return new RateLimitResult(true, 0, null);
    }

    public void incrementActiveJob(String clientIp) {
        globalActiveJobs.incrementAndGet();
        ipActiveJobs.computeIfAbsent(clientIp, k -> new AtomicInteger(0)).incrementAndGet();
    }

    public void decrementActiveJob(String clientIp) {
        globalActiveJobs.decrementAndGet();
        AtomicInteger active = ipActiveJobs.get(clientIp);
        if (active != null) {
            int val = active.decrementAndGet();
            if (val <= 0) {
                ipActiveJobs.remove(clientIp);
            }
        }
    }

    public int getGlobalActiveJobsCount() {
        return globalActiveJobs.get();
    }
}
