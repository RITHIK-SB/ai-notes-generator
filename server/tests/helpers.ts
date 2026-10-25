import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function makePdf(withText: string | null): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  if (withText) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText(withText, { x: 50, y: 720, size: 12, font });
  }
  return Buffer.from(await doc.save({ useObjectStreams: false }));
}

export async function makeDocx(text: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{ children: text.split('\n').map((line) => new Paragraph({ children: [new TextRun(line)] })) }],
  });
  return Packer.toBuffer(doc);
}
