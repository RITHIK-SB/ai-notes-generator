import { describe, expect, it } from 'vitest';
import { detectExtension, extractDocument, magicMatches } from '../src/services/extraction.js';
import { makeDocx, makePdf } from './helpers.js';

describe('detectExtension', () => {
  it('accepts supported extensions case-insensitively', () => {
    expect(detectExtension('notes.pdf')).toBe('.pdf');
    expect(detectExtension('LECTURE.PDF')).toBe('.pdf');
    expect(detectExtension('chapter.docx')).toBe('.docx');
    expect(detectExtension('readme.txt')).toBe('.txt');
  });
  it('rejects unsupported extensions', () => {
    expect(detectExtension('image.png')).toBeNull();
    expect(detectExtension('archive.zip')).toBeNull();
    expect(detectExtension('noextension')).toBeNull();
  });
});

describe('magicMatches', () => {
  it('validates PDF magic bytes', () => {
    expect(magicMatches(Buffer.from('%PDF-1.7 whatever'), '.pdf')).toBe(true);
    expect(magicMatches(Buffer.from('not a pdf'), '.pdf')).toBe(false);
  });
  it('validates DOCX (zip) magic bytes', () => {
    expect(magicMatches(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2]), '.docx')).toBe(true);
    expect(magicMatches(Buffer.from('plain text'), '.docx')).toBe(false);
  });
  it('rejects binary content claiming to be TXT', () => {
    expect(magicMatches(Buffer.from('hello world'), '.txt')).toBe(true);
    expect(magicMatches(Buffer.from([0x00, 0x01, 0x02]), '.txt')).toBe(false);
  });
});

describe('extractDocument', () => {
  it('extracts UTF-8 text from TXT', async () => {
    const buf = Buffer.from('Photosynthesis converts light energy into chemical energy.\n\nIt occurs in chloroplasts.', 'utf-8');
    const res = await extractDocument(buf, 'notes.txt');
    expect(res.kind).toBe('.txt');
    expect(res.text).toContain('Photosynthesis');
    expect(res.text).toContain('chloroplasts');
  });

  it('rejects an empty TXT file', async () => {
    await expect(extractDocument(Buffer.from('   \n  '), 'empty.txt')).rejects.toMatchObject({ code: 'EMPTY_DOCUMENT' });
  });

  it('rejects unsupported file types', async () => {
    await expect(extractDocument(Buffer.from('x'), 'photo.png')).rejects.toMatchObject({ code: 'UNSUPPORTED_FORMAT' });
  });

  it('rejects content that does not match its extension', async () => {
    await expect(extractDocument(Buffer.from('just text'), 'fake.pdf')).rejects.toMatchObject({ code: 'FILE_TYPE_MISMATCH' });
  });

  it('extracts text from a real PDF', async () => {
    const pdf = await makePdf('Photosynthesis is the process by which plants convert sunlight into energy.');
    const res = await extractDocument(pdf, 'lecture.pdf');
    expect(res.kind).toBe('.pdf');
    expect(res.pages).toBe(1);
    expect(res.text).toContain('Photosynthesis');
  });

  it('flags an image-only (scanned) PDF instead of pretending success', async () => {
    const pdf = await makePdf(null);
    await expect(extractDocument(pdf, 'scan.pdf')).rejects.toMatchObject({ code: 'PDF_NO_TEXT' });
  });

  it('rejects a corrupted PDF', async () => {
    const garbage = Buffer.from('%PDF-1.4 corrupted bytes that are not a real pdf structure');
    await expect(extractDocument(garbage, 'broken.pdf')).rejects.toMatchObject({ code: 'FILE_UNREADABLE' });
  });

  it('extracts paragraphs from a real DOCX', async () => {
    const docx = await makeDocx('Mitosis is cell division.\nIt produces two identical daughter cells.');
    const res = await extractDocument(docx, 'bio.docx');
    expect(res.kind).toBe('.docx');
    expect(res.text).toContain('Mitosis');
    expect(res.text).toContain('daughter cells');
  });

  it('rejects a malformed DOCX', async () => {
    await expect(extractDocument(Buffer.from('PK\x03\x04 not really a zip'), 'bad.docx')).rejects.toMatchObject({ code: 'FILE_UNREADABLE' });
  });
});
