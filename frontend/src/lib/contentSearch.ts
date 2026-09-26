import { PageData, ContentBlock, ImageDetail } from '../types';

export interface SnippetHighlight {
  prefix: string;
  match: string;
  suffix: string;
  location: 'title' | 'heading' | 'meta' | 'paragraph' | 'list' | 'quote' | 'code';
}

export interface MatchedMediaItem {
  id: string;
  url: string;
  alt: string;
  title?: string;
  sourcePageUrl: string;
  sourcePageTitle: string;
  isDirectMatch: boolean;
  matchReason?: string;
}

export interface SearchMatchResult {
  page: PageData;
  score: number;
  totalMatches: number;
  titleMatch: boolean;
  metaMatch: boolean;
  matchedHeadings: string[];
  snippets: SnippetHighlight[];
  matchedBlocks: ContentBlock[];
  directMedia: MatchedMediaItem[];
  allPageMedia: MatchedMediaItem[];
}

export interface SearchAnalysisReport {
  query: string;
  totalOccurrences: number;
  matchedPagesCount: number;
  results: SearchMatchResult[];
  allRelatedMedia: MatchedMediaItem[];
  directMediaCount: number;
  suggestedKeywords: string[];
}

/**
 * Escapes regex special characters in a search term.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safely extracts contextual snippet around first few occurrences of a query.
 */
function extractSnippets(
  text: string,
  query: string,
  maxSnippets: number = 4,
  contextRadius: number = 65,
  location: SnippetHighlight['location'] = 'paragraph'
): SnippetHighlight[] {
  if (!text || !query.trim()) return [];

  const snippets: SnippetHighlight[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

  let searchIndex = 0;
  while (searchIndex < text.length && snippets.length < maxSnippets) {
    // Try exact phrase first, then first token
    let foundIndex = lowerText.indexOf(lowerQuery, searchIndex);
    let matchedLength = lowerQuery.length;

    if (foundIndex === -1 && queryTokens.length > 1) {
      for (const token of queryTokens) {
        const tokenIdx = lowerText.indexOf(token, searchIndex);
        if (tokenIdx !== -1 && (foundIndex === -1 || tokenIdx < foundIndex)) {
          foundIndex = tokenIdx;
          matchedLength = token.length;
        }
      }
    }

    if (foundIndex === -1) break;

    // Window boundaries
    let start = Math.max(0, foundIndex - contextRadius);
    let end = Math.min(text.length, foundIndex + matchedLength + contextRadius);

    // Adjust to nearest word boundary
    if (start > 0) {
      const spaceIdx = text.indexOf(' ', start);
      if (spaceIdx !== -1 && spaceIdx < foundIndex) {
        start = spaceIdx + 1;
      }
    }
    if (end < text.length) {
      const spaceIdx = text.lastIndexOf(' ', end);
      if (spaceIdx !== -1 && spaceIdx > foundIndex + matchedLength) {
        end = spaceIdx;
      }
    }

    const prefix = (start > 0 ? '… ' : '') + text.substring(start, foundIndex);
    const match = text.substring(foundIndex, foundIndex + matchedLength);
    const suffix = text.substring(foundIndex + matchedLength, end) + (end < text.length ? ' …' : '');

    snippets.push({ prefix, match, suffix, location });
    searchIndex = foundIndex + matchedLength + 20; // advance to avoid repetitive overlaps
  }

  return snippets;
}

/**
 * Performs deep keyword & content search across all crawled pages.
 */
export function searchCrawledContent(pages: PageData[], query: string): SearchAnalysisReport {
  const cleanQuery = query.trim();

  // Extract frequent keywords for suggestion pills
  const suggestedKeywords = extractFrequentKeywords(pages);

  if (!cleanQuery || !pages || pages.length === 0) {
    return {
      query: cleanQuery,
      totalOccurrences: 0,
      matchedPagesCount: 0,
      results: [],
      allRelatedMedia: [],
      directMediaCount: 0,
      suggestedKeywords
    };
  }

  const lowerQuery = cleanQuery.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter((t) => t.length > 1);
  const regex = new RegExp(`(${escapeRegex(cleanQuery)})`, 'gi');

  const results: SearchMatchResult[] = [];
  const mediaMap = new Map<string, MatchedMediaItem>();
  let grandTotalOccurrences = 0;

  for (const page of pages) {
    let score = 0;
    let pageOccurrences = 0;
    const snippets: SnippetHighlight[] = [];
    const matchedHeadings: string[] = [];
    const matchedBlocks: ContentBlock[] = [];
    const directMedia: MatchedMediaItem[] = [];
    const allPageMedia: MatchedMediaItem[] = [];

    // 1. Check Title
    const titleMatch = Boolean(page.title && page.title.toLowerCase().includes(lowerQuery));
    if (titleMatch) {
      score += 15;
      pageOccurrences += (page.title.match(regex) || []).length || 1;
    }

    // 2. Check Description
    const metaMatch = Boolean(page.description && page.description.toLowerCase().includes(lowerQuery));
    if (metaMatch && page.description) {
      score += 8;
      pageOccurrences += (page.description.match(regex) || []).length || 1;
      snippets.push(...extractSnippets(page.description, cleanQuery, 1, 60, 'meta'));
    }

    // 3. Check Headings
    if (page.headings && page.headings.length > 0) {
      for (const h of page.headings) {
        if (h.toLowerCase().includes(lowerQuery)) {
          matchedHeadings.push(h);
          score += 8;
          pageOccurrences += (h.match(regex) || []).length || 1;
          snippets.push(...extractSnippets(h, cleanQuery, 1, 40, 'heading'));
        }
      }
    }

    // 4. Check Structured Blocks
    if (page.structuredContent && page.structuredContent.length > 0) {
      for (const block of page.structuredContent) {
        if (block.text && block.text.toLowerCase().includes(lowerQuery)) {
          matchedBlocks.push(block);
          score += 4;
          const loc: SnippetHighlight['location'] =
            block.type === 'LIST_ITEM' ? 'list' :
            block.type === 'QUOTE' ? 'quote' :
            block.type === 'CODE' ? 'code' : 'paragraph';
          snippets.push(...extractSnippets(block.text, cleanQuery, 1, 70, loc));
        }
      }
    }

    // 5. Check Full Text Content
    if (page.textContent) {
      const textMatches = (page.textContent.match(regex) || []).length;
      if (textMatches > 0) {
        pageOccurrences += textMatches;
        score += Math.min(textMatches * 2, 30);
        if (snippets.length < 5) {
          snippets.push(...extractSnippets(page.textContent, cleanQuery, 4 - snippets.length, 75, 'paragraph'));
        }
      }
    }

    // 6. Check Images & Media Metadata
    const seenMediaUrls = new Set<string>();

    // Check detailed images (with alt and title)
    if (page.imageDetails && page.imageDetails.length > 0) {
      for (const img of page.imageDetails) {
        if (!img.url || seenMediaUrls.has(img.url)) continue;
        seenMediaUrls.add(img.url);

        const altMatch = Boolean(img.alt && img.alt.toLowerCase().includes(lowerQuery));
        const titleImgMatch = Boolean(img.title && img.title.toLowerCase().includes(lowerQuery));
        const urlMatch = img.url.toLowerCase().includes(lowerQuery);
        const isDirect = altMatch || titleImgMatch || urlMatch;

        const mediaItem: MatchedMediaItem = {
          id: `${page.url}-${img.url}`,
          url: img.url,
          alt: img.alt || '',
          title: img.title || '',
          sourcePageUrl: page.url,
          sourcePageTitle: page.title || page.url,
          isDirectMatch: isDirect,
          matchReason: altMatch
            ? `Alt text matches "${cleanQuery}"`
            : titleImgMatch
            ? `Title matches "${cleanQuery}"`
            : urlMatch
            ? `File URL contains "${cleanQuery}"`
            : `Extracted from page discussing "${cleanQuery}"`
        };

        if (isDirect) {
          score += 12;
          pageOccurrences += 2;
          directMedia.push(mediaItem);
        }
        allPageMedia.push(mediaItem);
      }
    }

    // Check legacy / fallback image URLs
    if (page.images && page.images.length > 0) {
      for (const imgUrl of page.images) {
        if (!imgUrl || seenMediaUrls.has(imgUrl)) continue;
        seenMediaUrls.add(imgUrl);

        const urlMatch = imgUrl.toLowerCase().includes(lowerQuery);
        const mediaItem: MatchedMediaItem = {
          id: `${page.url}-${imgUrl}`,
          url: imgUrl,
          alt: '',
          sourcePageUrl: page.url,
          sourcePageTitle: page.title || page.url,
          isDirectMatch: urlMatch,
          matchReason: urlMatch
            ? `Image filename contains "${cleanQuery}"`
            : `Media on page matching "${cleanQuery}"`
        };

        if (urlMatch) {
          score += 10;
          pageOccurrences += 1;
          directMedia.push(mediaItem);
        }
        allPageMedia.push(mediaItem);
      }
    }

    // Multi-token fallback check
    if (pageOccurrences === 0 && queryTokens.length > 1) {
      let tokenHits = 0;
      for (const token of queryTokens) {
        if (
          (page.title && page.title.toLowerCase().includes(token)) ||
          (page.textContent && page.textContent.toLowerCase().includes(token))
        ) {
          tokenHits++;
        }
      }
      if (tokenHits > 0) {
        score += tokenHits * 3;
        pageOccurrences += tokenHits;
        if (page.textContent) {
          snippets.push(...extractSnippets(page.textContent, queryTokens[0], 2, 60, 'paragraph'));
        }
      }
    }

    if (pageOccurrences > 0 || score > 0) {
      grandTotalOccurrences += pageOccurrences;

      // Deduplicate snippets
      const uniqueSnippets: SnippetHighlight[] = [];
      const seenSnippetPrefixes = new Set<string>();
      for (const s of snippets) {
        const key = s.prefix.trim().slice(-20) + s.match + s.suffix.trim().slice(0, 20);
        if (!seenSnippetPrefixes.has(key)) {
          seenSnippetPrefixes.add(key);
          uniqueSnippets.push(s);
        }
      }

      results.push({
        page,
        score,
        totalMatches: pageOccurrences,
        titleMatch,
        metaMatch,
        matchedHeadings,
        snippets: uniqueSnippets,
        matchedBlocks,
        directMedia,
        allPageMedia
      });

      // Register media items into global collector
      for (const item of allPageMedia) {
        if (!mediaMap.has(item.url) || item.isDirectMatch) {
          mediaMap.set(item.url, item);
        }
      }
    }
  }

  // Sort pages by relevance score descending
  results.sort((a, b) => b.score - a.score);

  // Collect and sort all related media (direct matches first)
  const allRelatedMedia = Array.from(mediaMap.values()).sort((a, b) => {
    if (a.isDirectMatch && !b.isDirectMatch) return -1;
    if (!a.isDirectMatch && b.isDirectMatch) return 1;
    return 0;
  });

  const directMediaCount = allRelatedMedia.filter((m) => m.isDirectMatch).length;

  return {
    query: cleanQuery,
    totalOccurrences: grandTotalOccurrences,
    matchedPagesCount: results.length,
    results,
    allRelatedMedia,
    directMediaCount,
    suggestedKeywords
  };
}

/**
 * Extracts popular meaningful words from pages as search suggestions.
 */
function extractFrequentKeywords(pages: PageData[]): string[] {
  const stopWords = new Set([
    'the', 'and', 'with', 'from', 'this', 'that', 'were', 'which', 'about', 'more',
    'have', 'been', 'their', 'there', 'they', 'what', 'when', 'where', 'some', 'these',
    'will', 'would', 'could', 'should', 'each', 'page', 'site', 'view', 'read', 'link',
    'item', 'items', 'home', 'main', 'http', 'https', 'html', 'index', 'click', 'info'
  ]);

  const wordCounts = new Map<string, number>();

  for (const page of pages.slice(0, 15)) {
    if (page.title) {
      const words = page.title.toLowerCase().match(/\b[a-z]{4,15}\b/g) || [];
      for (const w of words) {
        if (!stopWords.has(w)) {
          wordCounts.set(w, (wordCounts.get(w) || 0) + 3);
        }
      }
    }
    if (page.headings) {
      for (const h of page.headings.slice(0, 10)) {
        const words = h.toLowerCase().match(/\b[a-z]{4,15}\b/g) || [];
        for (const w of words) {
          if (!stopWords.has(w)) {
            wordCounts.set(w, (wordCounts.get(w) || 0) + 2);
          }
        }
      }
    }
  }

  const sorted = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  const defaults = ['laptop', 'electronics', 'pricing', 'reviews', 'specifications'];
  const merged = Array.from(new Set([...sorted, ...defaults]));
  return merged.slice(0, 6);
}
