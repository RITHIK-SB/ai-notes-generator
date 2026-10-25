export class AppError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'AppError';
    }
}
export const Errors = {
    noInput: () => new AppError(400, 'NO_INPUT', 'No study material was provided. Paste text or upload a document first.'),
    unsupportedFormat: (ext) => new AppError(400, 'UNSUPPORTED_FORMAT', `Files of type "${ext || 'unknown'}" are not supported. Upload a PDF, DOCX, or TXT file.`),
    fileTooLarge: (maxMb) => new AppError(413, 'FILE_TOO_LARGE', `The file exceeds the ${maxMb} MB size limit. Try a smaller document.`),
    fileTypeMismatch: () => new AppError(400, 'FILE_TYPE_MISMATCH', 'The file contents do not match its extension. Upload a genuine PDF, DOCX, or TXT file.'),
    unreadableFile: (kind) => new AppError(422, 'FILE_UNREADABLE', `The ${kind} file could not be read. It may be corrupted, encrypted, or malformed.`),
    pdfNoText: () => new AppError(422, 'PDF_NO_TEXT', 'No selectable text was found in this PDF. It looks like a scanned document - OCR is not currently supported. Upload a text-based PDF, convert it with an OCR tool, or paste the text instead.'),
    emptyDocument: () => new AppError(422, 'EMPTY_DOCUMENT', 'The document contains no extractable text.'),
    inputTooShort: (min) => new AppError(400, 'INPUT_TOO_SHORT', `Please provide at least ${min} characters of study material.`),
    inputTooLarge: (max) => new AppError(413, 'INPUT_TOO_LARGE', `The material exceeds the ${max.toLocaleString()}-character processing limit. Split it into smaller parts and generate notes for each.`),
    invalidSettings: (detail) => new AppError(400, 'INVALID_SETTINGS', `Invalid generation settings: ${detail}`),
    aiNotConfigured: () => new AppError(503, 'AI_NOT_CONFIGURED', 'The AI provider is not configured yet. Set the AI_API_KEY environment variable on the server (see server/.env.example) and restart. No notes were generated.'),
    aiTimeout: () => new AppError(504, 'AI_TIMEOUT', 'The AI provider took too long to respond. Please try again.'),
    aiRateLimited: () => new AppError(429, 'AI_RATE_LIMITED', 'The AI provider rate limit was reached. Wait a moment and try again.'),
    aiUnavailable: () => new AppError(502, 'AI_UNAVAILABLE', 'The AI provider is currently unavailable. Please try again later.'),
    aiInvalidResponse: () => new AppError(502, 'AI_INVALID_RESPONSE', 'The AI provider returned an empty or malformed response. Please try again.'),
    rateLimited: () => new AppError(429, 'RATE_LIMITED', 'Too many requests from this device. Please wait a few minutes and try again.'),
    notFound: () => new AppError(404, 'NOT_FOUND', 'That resource does not exist.'),
};
