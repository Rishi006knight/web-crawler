package com.ssn.webcrawler.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.Duration;
import java.util.*;

/**
 * Service for fetching, parsing, caching, and evaluating robots.txt rules.
 * Caches parsed rules in Redis (crawler:robots:<domain>) with a 24-hour TTL.
 */
@Service
public class RobotsTxtService {

    private static final Logger log = LoggerFactory.getLogger(RobotsTxtService.class);
    private static final String ROBOTS_PREFIX = "crawler:robots:";
    private static final String USER_AGENT_NAME = "WebCrawler";

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${crawler.request-timeout-ms:5000}")
    private int requestTimeoutMs;

    public RobotsTxtService(RedisTemplate<String, String> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public static class RobotsRules {
        private String domain;
        private List<String> disallows = new ArrayList<>();
        private List<String> allows = new ArrayList<>();
        private long crawlDelayMs = 0;
        private List<String> sitemaps = new ArrayList<>();

        public RobotsRules() {}

        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }

        public List<String> getDisallows() { return disallows; }
        public void setDisallows(List<String> disallows) { this.disallows = disallows; }

        public List<String> getAllows() { return allows; }
        public void setAllows(List<String> allows) { this.allows = allows; }

        public long getCrawlDelayMs() { return crawlDelayMs; }
        public void setCrawlDelayMs(long crawlDelayMs) { this.crawlDelayMs = crawlDelayMs; }

        public List<String> getSitemaps() { return sitemaps; }
        public void setSitemaps(List<String> sitemaps) { this.sitemaps = sitemaps; }
    }

    /**
     * Checks if a target URL is allowed to be crawled according to robots.txt rules.
     */
    public boolean isAllowed(String urlString) {
        try {
            URI uri = new URI(urlString);
            String domain = uri.getHost();
            if (domain == null) return true;

            RobotsRules rules = getRulesForDomain(domain, uri.getScheme(), uri.getPort());
            String path = uri.getRawPath();
            if (path == null || path.isEmpty()) path = "/";
            if (uri.getRawQuery() != null) path += "?" + uri.getRawQuery();

            // Allow rules take precedence if longer or matching exactly
            for (String allow : rules.getAllows()) {
                if (matchesPattern(path, allow)) {
                    return true;
                }
            }

            for (String disallow : rules.getDisallows()) {
                if (!disallow.isEmpty() && matchesPattern(path, disallow)) {
                    log.debug("URL {} blocked by robots.txt disallow rule: {}", urlString, disallow);
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            log.debug("Error checking robots.txt for {}: {}", urlString, e.getMessage());
            return true;
        }
    }

    /**
     * Gets crawl delay for domain in milliseconds, or 0 if not specified.
     */
    public long getCrawlDelayMs(String urlString) {
        try {
            URI uri = new URI(urlString);
            String domain = uri.getHost();
            if (domain == null) return 0;
            RobotsRules rules = getRulesForDomain(domain, uri.getScheme(), uri.getPort());
            return rules.getCrawlDelayMs();
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Gets sitemap URLs discovered in robots.txt.
     */
    public List<String> getSitemaps(String urlString) {
        try {
            URI uri = new URI(urlString);
            String domain = uri.getHost();
            if (domain == null) return Collections.emptyList();
            RobotsRules rules = getRulesForDomain(domain, uri.getScheme(), uri.getPort());
            return rules.getSitemaps();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private RobotsRules getRulesForDomain(String domain, String scheme, int port) {
        String cacheKey = ROBOTS_PREFIX + domain.toLowerCase();
        try {
            String cachedJson = redisTemplate.opsForValue().get(cacheKey);
            if (cachedJson != null && !cachedJson.isBlank()) {
                return objectMapper.readValue(cachedJson, RobotsRules.class);
            }
        } catch (Exception e) {
            log.warn("Failed reading robots cache from Redis: {}", e.getMessage());
        }

        // Fetch fresh robots.txt
        RobotsRules rules = fetchAndParseRobotsTxt(domain, scheme, port);
        try {
            String json = objectMapper.writeValueAsString(rules);
            redisTemplate.opsForValue().set(cacheKey, json, Duration.ofHours(24));
        } catch (Exception e) {
            log.warn("Failed caching robots rules to Redis: {}", e.getMessage());
        }
        return rules;
    }

    private RobotsRules fetchAndParseRobotsTxt(String domain, String scheme, int port) {
        RobotsRules rules = new RobotsRules();
        rules.setDomain(domain);

        String portStr = (port > 0 && port != 80 && port != 443) ? ":" + port : "";
        String robotsUrl = (scheme != null ? scheme : "http") + "://" + domain + portStr + "/robots.txt";

        try {
            String robotsContent = Jsoup.connect(robotsUrl)
                    .userAgent(USER_AGENT_NAME + "/1.0")
                    .timeout(requestTimeoutMs)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .ignoreContentType(true)
                    .execute()
                    .body();

            if (robotsContent == null || robotsContent.isBlank()) {
                return rules;
            }

            parseRobotsContent(robotsContent, rules);
        } catch (Exception e) {
            log.debug("robots.txt not found or error for {}: {}", robotsUrl, e.getMessage());
        }

        return rules;
    }

    private void parseRobotsContent(String content, RobotsRules rules) {
        String[] lines = content.split("\\r?\\n");
        boolean isApplicableAgent = false;
        boolean sawSpecificAgent = false;

        for (String line : lines) {
            line = line.trim();
            int commentIdx = line.indexOf('#');
            if (commentIdx >= 0) {
                line = line.substring(0, commentIdx).trim();
            }
            if (line.isEmpty()) continue;

            int colonIdx = line.indexOf(':');
            if (colonIdx <= 0) continue;

            String directive = line.substring(0, colonIdx).trim().toLowerCase();
            String value = line.substring(colonIdx + 1).trim();

            if ("user-agent".equals(directive)) {
                String agent = value.toLowerCase();
                if (agent.equals(USER_AGENT_NAME.toLowerCase())) {
                    isApplicableAgent = true;
                    sawSpecificAgent = true;
                } else if (agent.equals("*") && !sawSpecificAgent) {
                    isApplicableAgent = true;
                } else {
                    isApplicableAgent = false;
                }
            } else if ("sitemap".equals(directive)) {
                if (value.startsWith("http://") || value.startsWith("https://")) {
                    rules.getSitemaps().add(value);
                }
            } else if (isApplicableAgent) {
                if ("disallow".equals(directive)) {
                    if (!value.isEmpty()) {
                        rules.getDisallows().add(value);
                    }
                } else if ("allow".equals(directive)) {
                    if (!value.isEmpty()) {
                        rules.getAllows().add(value);
                    }
                } else if ("crawl-delay".equals(directive)) {
                    try {
                        double delaySec = Double.parseDouble(value);
                        rules.setCrawlDelayMs((long) (delaySec * 1000));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
    }

    private boolean matchesPattern(String path, String pattern) {
        if (pattern.equals("/")) return true;
        if (pattern.endsWith("*")) {
            String prefix = pattern.substring(0, pattern.length() - 1);
            return path.startsWith(prefix);
        }
        return path.startsWith(pattern);
    }
}
