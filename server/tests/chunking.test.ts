import { describe, expect, it } from 'vitest';
import { chunkText } from '../src/services/chunking.js';

describe('chunkText', () => {
  it('returns a single chunk for small input', () => {
    expect(chunkText('hello world', 100)).toEqual(['hello world']);
  });

  it('splits long input into multiple ordered chunks without losing content', () => {
    const paras = Array.from({ length: 30 }, (_, i) => `Paragraph ${i + 1}. ` + 'word '.repeat(50)).join('\n\n');
    const chunks = chunkText(paras, 500);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(500 + 10);
    const joined = chunks.join('\n\n');
    for (let i = 1; i <= 30; i++) expect(joined).toContain(`Paragraph ${i}.`);
  });

  it('hard-splits a paragraph larger than the chunk size', () => {
    const big = 'x'.repeat(2500);
    const chunks = chunkText(big, 1000);
    expect(chunks.length).toBe(3);
    expect(chunks.join('')).toBe(big);
  });
});
