# Release Blocklist

**Status:** ✅ Implemented | Auto-blocklist failed releases, filter from future searches

## Overview
Prevents duplicate re-downloads by blocklisting releases that fail (either at the download client or during file organization) and re-queueing the request for a fresh search. Blocklisted releases are excluded from future search results, so the next ranked result is downloaded automatically.

## Key Details
- **Triggers:**
  - Organize processor fails with "No audiobook files found" or "No ebook files found" (wrong content type)
  - Monitor-download processor sees the client report `failed` (SAB par2 short, SAB aborted, qBit errored, etc.)
- **Action:** Release name saved to `blocked_releases`, failed download deleted from the client (with files), request routed to `awaiting_search`
- **Effect:** Search processor filters blocklisted releases before ranking → picks next best result
- **Scope:** Wrong-content and download-failure errors blocklist. Transient organize errors (ENOENT, EACCES, EPERM) still use the existing retry → `awaiting_import` path. Transient connection errors in monitor-download still backoff/retry the same download.
- **Loop bounds:**
  - `MAX_DOWNLOAD_ATTEMPTS = 5` (counted by `Request.downloadAttempts`) — caps how many downloads can fail per request.
  - `MAX_SEARCH_ATTEMPTS = 20` (counted by `Request.searchAttempts`) — caps how many fruitless searches can run per request (covers the case where every available release is blocklisted).
  - Both counters are **reset to 0** when the request reaches `downloaded` (organize success), so manual retries on a previously-completed request start clean.
  - On exhaustion: request → `failed`, `request_error` notification fired.
- **Match algorithm:** release names are normalized (lowercase, alphanumeric-only, common extensions stripped) before comparison so cosmetic variations between indexers (e.g. `Book.Title.2024.MP3` vs `Book Title (2024) [mp3]`) match the same blocklist entry. See `src/lib/utils/release-name.ts`.

## Flow (download failure)
1. Monitor-download sees `status='failed'` from the client → capture `errorMessage`
2. Mark `download_history.selected = false`, `downloadStatus='failed'`, `downloadError=...`
3. `client.deleteDownload(id, deleteFiles=true)` — for SABnzbd this falls back to a permanent history delete (with files) when the NZB is no longer in the queue
4. Insert into `blocked_releases` (idempotent on `releaseName + audiobookId`)
5. If `downloadAttempts < MAX_DOWNLOAD_ATTEMPTS`: set request to `awaiting_search` (retry-missing-torrents will re-trigger search; the blocklist filter skips this release)
6. Else: set request to `failed`, send `request_error` notification

## Flow (wrong content type, post-organize)
1. Organize fails (wrong content type) → blocklist release name from `download_history`
2. Deselect failed `download_history` entry
3. Set request status to `awaiting_search`
4. Search processor runs → queries `blocked_releases` for the audiobook → filters matches by `release_name`
5. Ranks remaining results → downloads next best → organize → success (or blocklist again)

## Database: `blocked_releases`
- `id` (UUID PK)
- `request_id` (FK nullable) — originating request
- `audiobook_id` (nullable) — audiobook this block applies to
- `release_name` — NZB/torrent name (matched against search result titles)
- `indexer_name` (nullable) — Prowlarr indexer name
- `indexer_id` (nullable) — Prowlarr indexer ID
- `reason` (text) — error message that triggered the block
- `created_at`
- Indexes: `release_name`, `audiobook_id`

## API Endpoints
- `GET /api/admin/blocklist` — list all blocked releases (admin only)
- `DELETE /api/admin/blocklist` — clear all blocked releases (admin only)
- `DELETE /api/admin/blocklist/:id` — remove single blocked release (admin only)

## File Locations
- Schema: `prisma/schema.prisma` (BlockedRelease model)
- Blocklist creation: `src/lib/processors/organize-files.processor.ts`, `src/lib/processors/monitor-download.processor.ts`
- Search filtering: `src/lib/processors/search-indexers.processor.ts`
- Admin API: `src/app/api/admin/blocklist/route.ts`, `src/app/api/admin/blocklist/[id]/route.ts`

## Related
- [phase3/prowlarr.md](../phase3/prowlarr.md) — Indexer search
- [phase3/ranking-algorithm.md](../phase3/ranking-algorithm.md) — Result ranking
- [phase3/file-organization.md](../phase3/file-organization.md) — File organization
- [phase3/sabnzbd.md](../phase3/sabnzbd.md) — SABnzbd client (history delete on failure)
- [backend/services/jobs.md](../backend/services/jobs.md) — Job processors
