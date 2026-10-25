declare module 'pdf-parse/lib/pdf-parse.js' {
  import type { Result } from 'pdf-parse';
  const pdfParse: (dataBuffer: Buffer, options?: Record<string, unknown>) => Promise<Result>;
  export default pdfParse;
}
