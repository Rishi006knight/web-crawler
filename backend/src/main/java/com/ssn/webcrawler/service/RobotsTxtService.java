package com.ssn.webcrawler.service;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RobotsTxtService {

    private static final Logger log = LoggerFactory.getLogger(RobotsTxtService.class);
    public static final String USER_AGENT = "WebCrawlerBot/1.0 (+https://web-crawler-ashy.vercel.app; bot@web-crawler.app)";

    private final Map<String, HostRobots> robotsCache = new ConcurrentHashMap<>();

    public record HostRobots(List<String> disallowedPrefixes, Integer crawlDelaySeconds) {
        public boolean isAllowed(String path) {
            if (path == null || path.isEmpty()) {
                path = "/";
            }
            for (String disallow : disallowedPrefixes) {
                if (disallow.isEmpty()) {
                    continue;
                }
                if (disallow.equals("/") || path.startsWith(disallow)) {
                    return false;
                }
            }
            return true;
        }
    }

    public boolean isAllowed(String targetUrl, boolean ignoreRobots) {
        if (ignoreRobots) {
            return true;
        }

        try {
            URI uri = URI.create(targetUrl);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null) {
                return true;
            }

            int port = uri.getPort();
            String origin = scheme + "://" + host + (port != -1 && port != 80 && port != 443 ? ":" + port : "");
            String path = uri.getPath();
            if (path == null || path.isEmpty()) {
                path = "/";
            }

            HostRobots hostRobots = robotsCache.computeIfAbsent(origin, this::fetchRobotsTxt);
            return hostRobots.isAllowed(path);
        } catch (Exception e) {
            log.debug("Error checking robots.txt for {}: {}", targetUrl, e.getMessage());
            return true;
        }
    }

    public Integer getCrawlDelay(String targetUrl) {
        try {
            URI uri = URI.create(targetUrl);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            int port = uri.getPort();
            String origin = scheme + "://" + host + (port != -1 && port != 80 && port != 443 ? ":" + port : "");
            HostRobots hr = robotsCache.get(origin);
            return hr != null ? hr.crawlDelaySeconds() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private HostRobots fetchRobotsTxt(String origin) {
        String robotsUrl = origin + "/robots.txt";
        List<String> disallowed = new ArrayList<>();
        Integer crawlDelay = null;

        try {
            Connection.Response res = Jsoup.connect(robotsUrl)
                    .userAgent(USER_AGENT)
                    .timeout(5000)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .execute();

            if (res.statusCode() == 200 && res.body() != null) {
                String body = res.body();
                String[] lines = body.split("\\r?\\n");
                boolean appliesToUs = false;

                for (String rawLine : lines) {
                    String line = rawLine.trim();
                    int hashIdx = line.indexOf('#');
                    if (hashIdx != -1) {
                        line = line.substring(0, hashIdx).trim();
                    }
                    if (line.isEmpty()) continue;

                    String lower = line.toLowerCase(Locale.ROOT);
                    if (lower.startsWith("user-agent:")) {
                        String agent = line.substring("user-agent:".length()).trim();
                        appliesToUs = agent.equals("*") || agent.equalsIgnoreCase("WebCrawlerBot");
                    } else if (appliesToUs && lower.startsWith("disallow:")) {
                        String prefix = line.substring("disallow:".length()).trim();
                        if (!prefix.isEmpty()) {
                            disallowed.add(prefix);
                        }
                    } else if (appliesToUs && lower.startsWith("crawl-delay:")) {
                        try {
                            crawlDelay = Integer.parseInt(line.substring("crawl-delay:".length()).trim());
                        } catch (Exception ignored) {}
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Could not fetch robots.txt for origin {}: {}", origin, e.getMessage());
        }

        return new HostRobots(Collections.unmodifiableList(disallowed), crawlDelay);
    }
}
