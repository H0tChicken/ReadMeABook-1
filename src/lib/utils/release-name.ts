/**
 * Component: Release Name Normalizer
 * Documentation: documentation/features/release-blocklist.md
 */

/**
 * Normalize a torrent/NZB release name for blocklist matching.
 *
 * Different indexers list the same release with cosmetic variations —
 * different separators (`.`, `_`, ` `, `-`), capitalization, parenthesization.
 * Normalizing both sides of the comparison makes the blocklist robust to
 * those variations so a re-search doesn't accidentally pick the same
 * already-failed release from a different source.
 *
 * We deliberately keep format-indicating tokens like `mp3`/`m4b` in the key.
 * They're often part of the title and dropping them could conflate genuinely
 * different releases (different format = different files).
 */
export function normalizeReleaseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
