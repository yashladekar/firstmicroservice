export function normalizePdfText(raw: string): string {
    return raw
        // remove excessive whitespace
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        // fix broken line sentences
        .replace(/([a-z])\n([a-z])/gi, "$1 $2")
        // normalize line breaks
        .replace(/\n{2,}/g, "\n\n")
        .trim();
}
