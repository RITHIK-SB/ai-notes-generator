/** Normalize extracted text without destroying meaningful content. */
export function preprocessText(raw) {
    return raw
        .replace(/\r\n?/g, '\n') // normalize line endings
        .replace(/\0/g, '') // drop NUL bytes
        .replace(/[ \t]+\n/g, '\n') // trailing spaces
        .replace(/\n{3,}/g, '\n\n') // collapse blank runs, keep paragraph breaks
        .replace(/[ \t]{2,}/g, ' ') // collapse horizontal whitespace runs
        .trim();
}
export function wordCount(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
}
