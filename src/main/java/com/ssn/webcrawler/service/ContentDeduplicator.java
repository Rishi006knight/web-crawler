package com.ssn.webcrawler.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;

/**
 * Service for content deduplication based on normalized text hashing (SHA-256).
 * Backed by Redis hash per job (crawler:hashes:<jobId>).
 */
@Service
public class ContentDeduplicator {

    private static final Logger log = LoggerFactory.getLogger(ContentDeduplicator.class);
    private static final String HASH_KEY_PREFIX = "crawler:hashes:";

    private final RedisTemplate<String, String> redisTemplate;

    public ContentDeduplicator(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Computes the SHA-256 hash of normalized text.
     */
    public String computeContentHash(String text) {
        if (text == null || text.isBlank()) {
            return "empty-content";
        }
        // Normalize: lowercase, collapse whitespace, strip punctuation noise
        String normalized = text.toLowerCase().replaceAll("\\s+", " ").trim();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(normalized.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(normalized.hashCode());
        }
    }

    /**
     * Checks if the content hash was already recorded for this job.
     * If so, returns the URL of the original page it is duplicate of.
     * If not, stores the mapping in Redis and returns null.
     */
    public String checkAndRegisterDuplicate(String jobId, String contentHash, String currentUrl) {
        if (contentHash == null || "empty-content".equals(contentHash)) {
            return null;
        }

        String hashRedisKey = HASH_KEY_PREFIX + jobId;
        try {
            // Check if hash exists in Redis Hash
            Object existingUrlObj = redisTemplate.opsForHash().get(hashRedisKey, contentHash);
            if (existingUrlObj != null) {
                String originalUrl = existingUrlObj.toString();
                if (!originalUrl.equalsIgnoreCase(currentUrl)) {
                    log.debug("Duplicate content detected for {} (matches {})", currentUrl, originalUrl);
                    return originalUrl;
                }
            } else {
                // Register this content hash for current URL
                redisTemplate.opsForHash().put(hashRedisKey, contentHash, currentUrl);
                redisTemplate.expire(hashRedisKey, Duration.ofDays(7));
            }
        } catch (Exception e) {
            log.warn("Error in content deduplication check: {}", e.getMessage());
        }
        return null;
    }

    public void clearHashes(String jobId) {
        redisTemplate.delete(HASH_KEY_PREFIX + jobId);
    }
}
