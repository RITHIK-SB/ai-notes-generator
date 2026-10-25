import mammoth from 'mammoth';
import { Errors } from '../errors.js';
import { extractPdfText } from './pdf.js';
import { preprocessText } from './preprocess.js';
export function detectExtension(filename) {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf'))
        return '.pdf';
    if (lower.endsWith('.docx'))
        return '.docx';
    if (lower.endsWith('.txt'))
        return '.txt';
    return null;
}
/** Validate content magic bytes against the claimed extension - never trust the name or MIME alone. */
export function magicMatches(buf, ext) {
    if (ext === '.pdf')
        return buf.length > 4 && buf.subarray(0, 4).toString('latin1') === '%PDF';
    if (ext === '.docx')
        return buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07);
    // TXT has no magic bytes; reject obvious binary content instead.
    if (ext === '.txt') {
        const sample = buf.subarray(0, Math.min(buf.length, 512));
        return !sample.includes(0x00);
    }
    return false;
}
async function extractPdf(buf) {
    let result;
    try {
        result = await extractPdfText(buf);
    }
    catch {
        throw Errors.unreadableFile('PDF');
    }
    const text = preprocessText(result.text);
    if (text.length < 20 && result.pages > 0) {
        // Pages exist but almost no text layer: nearly always a scanned/image-only PDF.
        throw Errors.pdfNoText();
    }
    if (text.length === 0)
        throw Errors.emptyDocument();
    return { text, kind: '.pdf', pages: result.pages, warnings: [] };
}
async function extractDocx(buf) {
    let result;
    try {
        result = await mammoth.extractRawText({ buffer: buf });
    }
    catch {
        throw Errors.unreadableFile('DOCX');
    }
    const text = preprocessText(result.value ?? '');
    if (text.length === 0)
        throw Errors.emptyDocument();
    const warnings = (result.messages ?? [])
        .filter((m) => m.type === 'warning')
        .map((m) => m.message)
        .slice(0, 3);
    return { text, kind: '.docx', warnings };
}
function extractTxt(buf) {
    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
    }
    catch {
        // Fall back to latin1 for legacy encodings.
        text = buf.toString('latin1');
    }
    const cleaned = preprocessText(text);
    if (cleaned.length === 0)
        throw Errors.emptyDocument();
    return { text: cleaned, kind: '.txt', warnings: [] };
}
export async function extractDocument(buf, filename) {
    const ext = detectExtension(filename);
    if (!ext) {
        const dot = filename.lastIndexOf('.');
        throw Errors.unsupportedFormat(dot >= 0 ? filename.slice(dot) : 'unknown');
    }
    if (!magicMatches(buf, ext))
        throw Errors.fileTypeMismatch();
    if (ext === '.pdf')
        return extractPdf(buf);
    if (ext === '.docx')
        return extractDocx(buf);
    return extractTxt(buf);
}
