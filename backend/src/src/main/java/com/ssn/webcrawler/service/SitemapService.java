package com.ssn.webcrawler.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Parser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.*;

/**
 * Service for discovering and parsing sitemap.xml and sitemap indexes.
 */
@Service
public class SitemapService {

    private static final Logger log = LoggerFactory.getLogger(SitemapService.class);
    private static final int MAX_SITEMAP_URLS = 1000;
    private static final int MAX_SITEMAP_DEPTH = 3;

    @Value("${crawler.request-timeout-ms:5000}")
    private int requestTimeoutMs;

    /**
     * Discovers all URLs from sitemap.xml for a given seed URL, plus any extra sitemap URLs from robots.txt.
     */
    public List<String> discoverUrls(String seedUrl, List<String> robotsSitemaps) {
        Set<String> discoveredUrls = new LinkedHashSet<>();
        Set<String> visitedSitemaps = new HashSet<>();

        List<String> candidateSitemaps = new ArrayList<>();
        if (robotsSitemaps != null) {
            candidateSitemaps.addAll(robotsSitemaps);
        }

        try {
            URI uri = new URI(seedUrl);
            String defaultSitemap = uri.getScheme() + "://" + uri.getHost() +
                    (uri.getPort() > 0 && uri.getPort() != 80 && uri.getPort() != 443 ? ":" + uri.getPort() : "") +
                    "/sitemap.xml";
            if (!candidateSitemaps.contains(defaultSitemap)) {
                candidateSitemaps.add(defaultSitemap);
            }
        } catch (Exception e) {
            log.warn("Invalid seed URL for sitemap discovery: {}", seedUrl);
        }

        for (String sitemapUrl : candidateSitemaps) {
            crawlSitemap(sitemapUrl, discoveredUrls, visitedSitemaps, 0);
            if (discoveredUrls.size() >= MAX_SITEMAP_URLS) break;
        }

        return new ArrayList<>(discoveredUrls);
    }

    private void crawlSitemap(String sitemapUrl, Set<String> discoveredUrls, Set<String> visitedSitemaps, int depth) {
        if (depth > MAX_SITEMAP_DEPTH || visitedSitemaps.contains(sitemapUrl) || discoveredUrls.size() >= MAX_SITEMAP_URLS) {
            return;
        }
        visitedSitemaps.add(sitemapUrl);

        try {
            log.info("Fetching sitemap: {}", sitemapUrl);
            Document doc = Jsoup.connect(sitemapUrl)
                    .parser(Parser.xmlParser())
                    .timeout(requestTimeoutMs)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .ignoreContentType(true)
                    .get();

            // 1. Check for sitemap index (<sitemapindex><sitemap><loc>...</loc></sitemap></sitemapindex>)
            for (Element sitemapElem : doc.select("sitemap > loc")) {
                String nestedSitemap = sitemapElem.text().trim();
                if (!nestedSitemap.isEmpty() && !visitedSitemaps.contains(nestedSitemap)) {
                    crawlSitemap(nestedSitemap, discoveredUrls, visitedSitemaps, depth + 1);
                }
            }

            // 2. Extract standard url entries (<urlset><url><loc>...</loc></url></urlset>)
            for (Element locElem : doc.select("url > loc")) {
                String loc = locElem.text().trim();
                if (!loc.isEmpty()) {
                    discoveredUrls.add(loc);
                    if (discoveredUrls.size() >= MAX_SITEMAP_URLS) break;
                }
            }
        } catch (Exception e) {
            log.debug("Failed reading sitemap {}: {}", sitemapUrl, e.getMessage());
        }
    }
}
