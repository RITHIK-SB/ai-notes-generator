import { jsPDF } from 'jspdf';

/** Build a descriptive, filesystem-safe filename like AI_Notes_Photosynthesis_2026-10-25.md */
export function buildFilename(title: string, ext: 'txt' | 'md' | 'pdf', existing: Set<string> = new Set()): string {
  const date = new Date().toISOString().slice(0, 10);
  const safe =
    title
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 60) || 'Untitled';
  let name = `AI_Notes_${safe}_${date}.${ext}`;
  let i = 2;
  while (existing.has(name)) {
    name = `AI_Notes_${safe}_${date}_${i}.${ext}`;
    i++;
  }
  return name;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTxt(title: string, markdown: string, existing?: Set<string>): string {
  const filename = buildFilename(title, 'txt', existing);
  const text = `${title}\n${'='.repeat(Math.min(title.length, 60))}\n\n${markdownToPlain(markdown)}`;
  triggerDownload(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
  return filename;
}

export function downloadMd(title: string, markdown: string, existing?: Set<string>): string {
  const filename = buildFilename(title, 'md', existing);
  const content = `# ${title}\n\n${markdown}`;
  triggerDownload(new Blob([content], { type: 'text/markdown;charset=utf-8' }), filename);
  return filename;
}

/** Convert a small Markdown subset to plain text for TXT/PDF export. */
export function markdownToPlain(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

export function downloadPdf(title: string, markdown: string, existing?: Set<string>): string {
  const filename = buildFilename(title, 'pdf', existing);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(49, 46, 129);
  const titleLines = doc.splitTextToSize(title, maxWidth) as string[];
  ensureSpace(titleLines.length * 24);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 24 + 12;

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      y += 8;
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const bullet = line.match(/^(\s*)[-*+]\s+(.*)$/);
    const numbered = line.match(/^(\s*)\d+[.)]\s+(.*)$/);
    let text = markdownToPlain(line);
    let size = 11;
    let style: 'normal' | 'bold' = 'normal';
    let indent = margin;

    if (heading) {
      const level = heading[1].length;
      size = level <= 2 ? 15 : 13;
      style = 'bold';
      text = markdownToPlain(heading[2]);
      y += 6;
    } else if (bullet) {
      indent = margin + 14 + Math.min(bullet[1].length, 8) * 2;
      text = `\u2022  ${markdownToPlain(bullet[2])}`;
    } else if (numbered) {
      indent = margin + 14;
    }

    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(heading ? 67 : 31, heading ? 56 : 41, heading ? 202 : 55);
    const lines = doc.splitTextToSize(text, pageWidth - indent - margin) as string[];
    const lineHeight = size * 1.45;
    ensureSpace(lines.length * lineHeight);
    doc.text(lines, indent, y);
    y += lines.length * lineHeight;
  }

  doc.save(filename);
  return filename;
}
