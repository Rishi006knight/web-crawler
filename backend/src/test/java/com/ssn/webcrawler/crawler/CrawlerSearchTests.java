package com.ssn.webcrawler.crawler;

import com.ssn.webcrawler.model.ContentBlock;
import com.ssn.webcrawler.model.CrawlJob;
import com.ssn.webcrawler.model.ImageDetail;
import com.ssn.webcrawler.model.PageData;
import com.ssn.webcrawler.repository.CrawlJobRepository;
import com.ssn.webcrawler.repository.PageDataRepository;
import com.ssn.webcrawler.security.RateLimiterService;
import com.ssn.webcrawler.security.UrlSecurityValidator;
import com.ssn.webcrawler.service.CrawlerService;
import com.ssn.webcrawler.service.RobotsTxtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CrawlerSearchTests {

    private CrawlerService crawlerService;
    private CrawlJobRepository crawlJobRepository;
    private PageDataRepository pageDataRepository;

    @BeforeEach
    void setUp() {
        crawlJobRepository = mock(CrawlJobRepository.class);
        pageDataRepository = mock(PageDataRepository.class);
        UrlSecurityValidator urlSecurityValidator = new UrlSecurityValidator();
        RateLimiterService rateLimiterService = new RateLimiterService();
        RobotsTxtService robotsTxtService = new RobotsTxtService();

        crawlerService = new CrawlerService(
                crawlJobRepository,
                pageDataRepository,
                urlSecurityValidator,
                rateLimiterService,
                robotsTxtService
        );
    }

    @Test
    @DisplayName("Search finds content matching keyword like 'laptop' and extracts snippets and images")
    void testSearchPagesFindsKeywordContentAndImages() {
        CrawlJob job = new CrawlJob("job-search-1", "https://amazon.in", 10, 2);

        PageData laptopPage = new PageData(
                "https://amazon.in/laptops",
                "Best Laptops & Electronics - Amazon.in",
                "Explore cutting edge electronics and high-performance gaming laptops with great deals.",
                200,
                List.of("H1: Electronics Store", "H2: Top Rated Laptops 2024"),
                "We offer a wide selection of laptops including thin and light ultrabooks, powerful gaming laptops, and everyday budget laptops.",
                List.of(
                        new ContentBlock("h2", "HEADING", "Top Rated Laptops 2024"),
                        new ContentBlock("p", "PARAGRAPH", "Compare Intel Core i7 laptops and Apple MacBook laptops for office work.")
                ),
                120,
                List.of("https://amazon.in/deal-1"),
                List.of("https://images.amazon.com/laptop-1.jpg"),
                List.of(new ImageDetail("https://images.amazon.com/laptop-1.jpg", "Dell Inspiron 15 Laptop with 16GB RAM", "Dell Laptop"))
        );

        PageData bookPage = new PageData(
                "https://amazon.in/books",
                "Bestselling Fiction Books",
                "Read bestselling thrillers and novels.",
                200,
                List.of("H1: Books Store"),
                "Explore thousands of fiction and nonfiction books.",
                List.of(),
                80,
                List.of(),
                List.of("https://images.amazon.com/book-1.jpg"),
                List.of(new ImageDetail("https://images.amazon.com/book-1.jpg", "Hardcover Book Cover", "Book"))
        );

        job.addPage(laptopPage);
        job.addPage(bookPage);

        // Populate active jobs via reflection or starting a job, or mock getJob
        // Since activeJobs is private and getJob checks activeJobs then repo, let's mock repo to return an entity
        // Or we can register the job in activeJobs by starting a dummy job or mock repo
        com.ssn.webcrawler.entity.CrawlJobEntity entity = new com.ssn.webcrawler.entity.CrawlJobEntity("job-search-1", "https://amazon.in", 10, 2);
        com.ssn.webcrawler.entity.PageDataEntity pEntity = new com.ssn.webcrawler.entity.PageDataEntity();
        pEntity.setUrl("https://amazon.in/laptops");
        pEntity.setTitle("Best Laptops & Electronics - Amazon.in");
        pEntity.setDescription("Explore cutting edge electronics and high-performance gaming laptops.");
        pEntity.setTextContent("We offer a wide selection of laptops including ultrabooks.");
        pEntity.setHeadingsJson("[\"H1: Electronics Store\", \"H2: Top Rated Laptops 2024\"]");
        pEntity.setImagesJson("[\"https://images.amazon.com/laptop-1.jpg\"]");
        pEntity.setImageDetailsJson("[{\"url\":\"https://images.amazon.com/laptop-1.jpg\",\"alt\":\"Dell Inspiron 15 Laptop\",\"title\":\"Dell Laptop\"}]");
        entity.addPage(pEntity);

        when(crawlJobRepository.findById("job-search-1")).thenReturn(Optional.of(entity));

        Map<String, Object> results = crawlerService.searchPages("job-search-1", "laptop");

        assertNotNull(results);
        assertEquals("laptop", results.get("query"));
        assertTrue((Integer) results.get("totalMatches") > 0);
        assertEquals(1, results.get("matchedPagesCount"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> pageResults = (List<Map<String, Object>>) results.get("results");
        assertEquals(1, pageResults.size());

        Map<String, Object> first = pageResults.get(0);
        assertEquals("https://amazon.in/laptops", first.get("url"));

        @SuppressWarnings("unchecked")
        List<String> headings = (List<String>) first.get("matchedHeadings");
        assertTrue(headings.stream().anyMatch(h -> h.contains("Laptops")));

        @SuppressWarnings("unchecked")
        List<ImageDetail> media = (List<ImageDetail>) first.get("matchedMedia");
        assertEquals(1, media.size());
        assertTrue(media.get(0).getAlt().contains("Laptop"));
    }
}
