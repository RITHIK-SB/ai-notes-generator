import { describe, expect, it } from 'vitest';
import { preprocessText, wordCount } from '../src/services/preprocess.js';

describe('preprocessText', () => {
  it('normalizes line endings', () => {
    expect(preprocessText('a\r\nb\rc')).toBe('a\nb\nc');
  });
  it('collapses runs of blank lines but preserves paragraph breaks', () => {
    expect(preprocessText('a\n\n\n\n\nb')).toBe('a\n\nb');
  });
  it('trims trailing spaces and outer whitespace', () => {
    expect(preprocessText('  hello   \n world  ')).toBe('hello\n world');
  });
  it('preserves punctuation, symbols and formulas', () => {
    const src = 'E = mc^2, H2O -> H+ + OH-; rate: 3.5%';
    expect(preprocessText(src)).toBe(src);
  });
});

describe('wordCount', () => {
  it('counts words', () => {
    expect(wordCount('one two three')).toBe(3);
    expect(wordCount('   ')).toBe(0);
  });
});
