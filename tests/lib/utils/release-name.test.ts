/**
 * Component: Release Name Normalizer Tests
 * Documentation: documentation/features/release-blocklist.md
 */

import { describe, expect, it } from 'vitest';
import { normalizeReleaseName } from '@/lib/utils/release-name';

describe('normalizeReleaseName', () => {
  it('lowercases and strips non-alphanumeric characters', () => {
    expect(normalizeReleaseName('Book.Title.2024.MP3')).toBe('booktitle2024mp3');
    expect(normalizeReleaseName('Book Title (2024) [mp3]')).toBe('booktitle2024mp3');
  });

  it('treats cosmetic variations of the same release as equal', () => {
    const a = normalizeReleaseName('Book.Title.2024.MP3');
    const b = normalizeReleaseName('book_title_2024_mp3');
    const c = normalizeReleaseName('Book Title - 2024 (MP3)');
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('preserves format tokens so different formats stay distinct', () => {
    expect(normalizeReleaseName('Book.Title.2024.MP3')).not.toBe(
      normalizeReleaseName('Book.Title.2024.M4B')
    );
  });

  it('keeps distinct releases distinct', () => {
    expect(normalizeReleaseName('Book One 2024')).not.toBe(normalizeReleaseName('Book Two 2024'));
  });
});
