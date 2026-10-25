import path from 'node:path';
import { createRequire } from 'node:module';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Resolve from the installed package, not src/dist directory depth.
const require = createRequire(import.meta.url);
const standardFontDataUrl = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts') + path.sep;

export interface PdfExtraction {
  text: string;
  pages: number;
}

export async function extractPdfText(buf: Buffer): Promise<PdfExtraction> {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buf),
    standardFontDataUrl,
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;
  try {
    const parts: string[] = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      // Preserve page order; join items with spaces, pages with paragraph breaks.
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageText) parts.push(pageText);
    }
    return { text: parts.join('\n\n'), pages: doc.numPages };
  } finally {
    await loadingTask.destroy();
  }
}
