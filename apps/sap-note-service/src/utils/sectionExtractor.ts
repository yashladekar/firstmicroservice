export function extractSection(
    text: string,
    start: RegExp,
    end?: RegExp
): string | null {
    const startMatch = text.search(start);
    if (startMatch === -1) return null;

    const sliced = text.slice(startMatch);
    if (!end) return sliced;

    const endMatch = sliced.search(end);
    return endMatch === -1
        ? sliced
        : sliced.slice(0, endMatch);
}
