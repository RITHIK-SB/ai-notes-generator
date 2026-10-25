import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Works from both src/ (tsx dev) and dist/ (compiled): climb to the package root.
const standardFontDataUrl = path.resolve(__dirname, '../node_modules/pdfjs-dist/standard_fonts') + path.sep;
export async function extractPdfText(buf) {
    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buf),
        standardFontDataUrl,
        useSystemFonts: true,
    });
    const doc = await loadingTask.promise;
    try {
        const parts = [];
        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            const page = await doc.getPage(pageNum);
            const content = await page.getTextContent();
            // Preserve page order; join items with spaces, pages with paragraph breaks.
            const pageText = content.items
                .map((item) => ('str' in item ? item.str : ''))
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (pageText)
                parts.push(pageText);
        }
        return { text: parts.join('\n\n'), pages: doc.numPages };
    }
    finally {
        await loadingTask.destroy();
    }
}
