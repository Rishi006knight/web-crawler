package com.ssn.webcrawler.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class UrlNormalizerTests {

    private UrlNormalizer normalizer;

    @BeforeEach
    void setUp() {
        normalizer = new UrlNormalizer();
    }

    @Test
    void testIndexHtmlCollapsesToSameUrl() {
        String base = normalizer.normalize("https://books.toscrape.com");
        String withIndex = normalizer.normalize("https://books.toscrape.com/index.html");
        assertEquals(base, withIndex, "https://books.toscrape.com/index.html must normalize to https://books.toscrape.com/");
    }

    @Test
    void testStripFragment() {
        String normalized = normalizer.normalize("https://example.com/page#section1");
        assertEquals("https://example.com/page", normalized);
    }

    @Test
    void testRemoveDefaultPorts() {
        String http = normalizer.normalize("http://example.com:80/path");
        String https = normalizer.normalize("https://example.com:443/path");
        assertEquals("http://example.com/path", http);
        assertEquals("https://example.com/path", https);
    }

    @Test
    void testStripTrackingParamsAndSortRemaining() {
        String url = "https://example.com/product?utm_source=twitter&b=2&fbclid=xyz123&a=1&utm_medium=social";
        String normalized = normalizer.normalize(url);
        assertEquals("https://example.com/product?a=1&b=2", normalized);
    }

    @Test
    void testLowercaseHostAndScheme() {
        String url = "HTTPS://WWW.EXAMPLE.COM/Path";
        String normalized = normalizer.normalize(url);
        assertEquals("https://www.example.com/Path", normalized);
    }
}
