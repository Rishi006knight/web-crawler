package com.ssn.webcrawler.service;

import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;

@Component
public class UrlNormalizer {

    private static final Set<String> TRACKING_PARAMS = Set.of(
            "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
            "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "_ga"
    );

    private static final Pattern INDEX_FILE_PATTERN = Pattern.compile("(?i)/(index|default)\\.(html?|php|asp|aspx)$");

    public String normalize(String urlStr) {
        if (urlStr == null || urlStr.trim().isEmpty()) {
            return urlStr;
        }

        try {
            // Trim and strip fragment
            String cleaned = urlStr.trim();
            int hashIdx = cleaned.indexOf('#');
            if (hashIdx >= 0) {
                cleaned = cleaned.substring(0, hashIdx);
            }

            URI uri = URI.create(cleaned).normalize();
            String scheme = uri.getScheme();
            if (scheme == null) {
                return urlStr;
            }
            scheme = scheme.toLowerCase(Locale.ROOT);

            String host = uri.getHost();
            if (host == null) {
                return urlStr;
            }
            host = host.toLowerCase(Locale.ROOT);

            int port = uri.getPort();
            if (( "http".equals(scheme) && port == 80 ) || ( "https".equals(scheme) && port == 443 )) {
                port = -1; // remove default port
            }

            String path = uri.getPath();
            if (path == null || path.isEmpty()) {
                path = "/";
            } else {
                // Collapse index.html / index.htm / index.php to trailing slash
                path = INDEX_FILE_PATTERN.matcher(path).replaceAll("/");
                // Collapse duplicate consecutive slashes
                path = path.replaceAll("/{2,}", "/");
                // If path is empty, make it "/"
                if (path.isEmpty()) {
                    path = "/";
                }
            }

            // Clean & sort query parameters
            String rawQuery = uri.getRawQuery();
            String query = normalizeQuery(rawQuery);

            StringBuilder sb = new StringBuilder();
            sb.append(scheme).append("://").append(host);
            if (port > 0) {
                sb.append(":").append(port);
            }
            sb.append(path);
            if (query != null && !query.isEmpty()) {
                sb.append("?").append(query);
            }

            return sb.toString();
        } catch (Exception e) {
            return urlStr;
        }
    }

    private String normalizeQuery(String rawQuery) {
        if (rawQuery == null || rawQuery.trim().isEmpty()) {
            return null;
        }

        String[] pairs = rawQuery.split("&");
        List<Map.Entry<String, String>> paramList = new ArrayList<>();

        for (String pair : pairs) {
            if (pair.isEmpty()) continue;
            int eqIdx = pair.indexOf('=');
            String key;
            String val = "";
            if (eqIdx >= 0) {
                key = pair.substring(0, eqIdx);
                val = pair.substring(eqIdx + 1);
            } else {
                key = pair;
            }

            try {
                String decodedKey = URLDecoder.decode(key, StandardCharsets.UTF_8).toLowerCase(Locale.ROOT);
                if (TRACKING_PARAMS.contains(decodedKey) || decodedKey.startsWith("utm_")) {
                    continue; // Skip tracking param
                }
                paramList.add(new AbstractMap.SimpleEntry<>(key, val));
            } catch (Exception ignored) {
                paramList.add(new AbstractMap.SimpleEntry<>(key, val));
            }
        }

        if (paramList.isEmpty()) {
            return null;
        }

        // Sort parameters for deterministic caching and deduplication
        paramList.sort(Map.Entry.comparingByKey());

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < paramList.size(); i++) {
            if (i > 0) sb.append("&");
            Map.Entry<String, String> entry = paramList.get(i);
            sb.append(entry.getKey());
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                sb.append("=").append(entry.getValue());
            }
        }
        return sb.toString();
    }
}
