export function normalizePdfText(raw: string): string {
    return raw
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/([a-z])\n([a-z])/gi, "$1 $2")
        .replace(/\n{2,}/g, "\n\n")
        .replace(/Component\s*:/gi, "Component:")
        .replace(/Version\s*:/gi, "Version:")
        .replace(/Release\s*:/gi, "Release:")
        .trim();
}
