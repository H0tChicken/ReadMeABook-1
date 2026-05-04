# Release Blocklist

**Status:** ✅ Implemented | Auto-blocklist failed releases, filter from future searches

## Overview
Prevents duplicate re-downloads by blocklisting releases that fail file organization (e.g., epub downloaded instead of audiobook). Blocklisted releases are excluded from future search results, and the request is automatically re-queued for a new search.

## Key Details
- **Trigger:** Organize processor fails with "No audiobook files found" or "No ebook files found"
- **Action:** Release name saved to `blocked_releases` table, request routed to `awaiting_search`
- **Effect:** Search processor filters blocklisted releases before ranking → picks next best result
- **Scope:** Only wrong-content errors are blocklisted; transient errors (ENOENT, EACCES, EPERM) still use the existing retry → `awaiting_import` path

## Flow
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
- Blocklist creation: `src/lib/processors/organize-files.processor.ts`
- Search filtering: `src/lib/processors/search-indexers.processor.ts`
- Admin API: `src/app/api/admin/blocklist/route.ts`, `src/app/api/admin/blocklist/[id]/route.ts`

## Related
- [phase3/prowlarr.md](../phase3/prowlarr.md) — Indexer search
- [phase3/ranking-algorithm.md](../phase3/ranking-algorithm.md) — Result ranking
- [phase3/file-organization.md](../phase3/file-organization.md) — File organization
- [backend/services/jobs.md](../backend/services/jobs.md) — Job processors
