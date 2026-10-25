// Exercise the compiled server over real multipart HTTP, not the TS test runner.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph } from 'docx';
import { createApp } from '../dist/app.js';

const text = 'Photosynthesis converts sunlight into chemical energy. Plants use water and carbon dioxide to make glucose and oxygen in chloroplasts.';
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
pdf.addPage().drawText(text, { x: 40, y: 700, size: 10, maxWidth: 500, lineHeight: 16, font });
const docx = new Document({ sections: [{ children: [new Paragraph(text)] }] });
const fixtures = [
  ['biology.pdf', await pdf.save(), 'application/pdf'],
  ['biology.docx', await Packer.toBuffer(docx), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['biology.txt', Buffer.from(text), 'text/plain'],
];
const server = createApp().listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const url = `http://127.0.0.1:${server.address().port}/api/extract`;
  for (const [filename, bytes, type] of fixtures) {
    const form = new FormData();
    form.append('file', new Blob([bytes], { type }), filename);
    const response = await fetch(url, { method: 'POST', body: form });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(result.success, true);
    assert.match(result.extraction.text, /Photosynthesis/);
    assert.match(result.extraction.text, /chloroplasts/);
    console.log(`PASS compiled multipart upload: ${filename}`);
  }
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
