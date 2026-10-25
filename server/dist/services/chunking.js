/**
 * Split text into logically ordered chunks on paragraph boundaries,
 * never silently truncating: every character ends up in exactly one chunk.
 */
export function chunkText(text, chunkChars) {
    if (text.length <= chunkChars)
        return [text];
    const paragraphs = text.split(/\n{2,}/);
    const chunks = [];
    let current = '';
    const flush = () => {
        if (current.trim().length > 0)
            chunks.push(current.trim());
        current = '';
    };
    for (const para of paragraphs) {
        if (para.length > chunkChars) {
            // Oversized paragraph: hard-split on sentence-ish boundaries, then characters.
            flush();
            let rest = para;
            while (rest.length > chunkChars) {
                let cut = rest.lastIndexOf('. ', chunkChars);
                if (cut < chunkChars * 0.5)
                    cut = chunkChars; // no good boundary: hard cut
                else
                    cut += 1;
                chunks.push(rest.slice(0, cut).trim());
                rest = rest.slice(cut);
            }
            current = rest;
            continue;
        }
        if ((current + '\n\n' + para).trim().length > chunkChars)
            flush();
        current = current ? current + '\n\n' + para : para;
    }
    flush();
    return chunks;
}
