# Production Web Crawler & Mission Control Dashboard (Spring Boot + Redis + React)

A production-grade, distributed web crawler engine with Redis queue persistence, robots.txt compliance, politeness rate-limiting, sitemap discovery, content deduplication, exponential retry backoff, and a **Mission Control Real-Time Dashboard** featuring an interactive **Force-Directed Link Graph**.

---

## Architecture & Features

1. **Robots.txt Compliance**: Automatically parses and caches `/robots.txt` per domain in Redis (24h TTL), respecting `Disallow` rules and `Crawl-delay`.
2. **Politeness & Concurrency**: Redis-coordinated per-domain delay (default 500ms or `Crawl-delay`) and per-domain concurrency throttling.
3. **Redis Persistent Queue**: Replaces in-memory queues with Redis LIST (`crawler:queue:<jobId>`). Resumes interrupted jobs automatically on server restart.
4. **Domain Scope Control**: Support for `SAME_DOMAIN`, `SAME_DOMAIN_AND_SUBDOMAINS`, and `ANY`.
5. **Sitemap Discovery**: Fetches and parses `/sitemap.xml` and recursive sitemap indexes before BFS crawl.
6. **Content Deduplication**: SHA-256 normalized text hashing flags mirror/duplicate pages (`isDuplicate: true`, `isDuplicateOf: <originalUrl>`).
7. **Exponential Backoff Retries**: Retries transient 5xx/timeouts up to 2 times with exponential wait (1s, 3s), logging failed URLs.
8. **Redis Persistent Jobs**: Stores full `CrawlResult` metadata in Redis (`crawler:job:<jobId>`) with 7-day retention.
9. **Export Endpoints**: Instant export to RFC4180 CSV (`/api/crawl/{jobId}/export?format=csv`) and formatted JSON (`format=json`).
10. **Crawler Telemetry & Stats**: Real-time aggregate analytics across all jobs (`/api/stats`).
11. **Mission Control UI**: Interactive Force-Directed Link Graph (Canvas/SVG), live TanStack-style auto-polling, collapsible page details drawer, sortable/filterable tables, and dark-mode aesthetic.

---

## Quick Start

### 1. Run via Docker Compose
```bash
docker-compose up --build
```
- **Mission Control Dashboard**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)
- **Redis Server**: `localhost:6379`

### 2. Run Locally (Development)
Ensure Redis is running (`docker run -d -p 6379:6379 redis:7-alpine`).
```bash
# Start Spring Boot Application
./mvnw spring-boot:run
# or on Windows:
mvn spring-boot:run
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/crawl` | Start a new crawl job with configurable scope, sitemap, and robots.txt rules. |
| `GET` | `/api/crawl/{jobId}` | Poll job status, progress, and results (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`). |
| `GET` | `/api/crawl` | List all past and active crawl jobs. |
| `DELETE` | `/api/crawl/{jobId}/cache` | Clear Redis visited-set, queue, and duplicate hash cache for a job. |
| `DELETE` | `/api/crawl/{jobId}` | Permanently delete job metadata and cache from Redis. |
| `GET` | `/api/crawl/{jobId}/export?format=csv\|json` | Download crawl results as CSV or JSON file. |
| `GET` | `/api/stats` | Global crawler statistics (total pages, unique domains, active jobs, emails). |

### Request Body (`POST /api/crawl`)
```json
{
  "seedUrl": "https://example.com",
  "maxDepth": 2,
  "maxPages": 30,
  "keyword": "optional keyword",
  "scope": "SAME_DOMAIN", 
  "respectRobotsTxt": true,
  "useSitemap": false
}
```
*Note: `scope` options are `"SAME_DOMAIN"`, `"SAME_DOMAIN_AND_SUBDOMAINS"`, `"ANY"`.*

---

## Frontend Mission Control Dashboard

The UI is packaged directly into Spring Boot (`src/main/resources/static/index.html`) and available at [http://localhost:8080](http://localhost:8080).

A separate React 18 + Vite + TypeScript project is also provided in `/frontend`:
```bash
cd frontend
npm install
npm run dev
```
Proxy is preconfigured in `vite.config.ts` to `http://localhost:8080`.
