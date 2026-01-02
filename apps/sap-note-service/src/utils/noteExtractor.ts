import { extractSection } from "./sectionExtractor";

export type ExtractedNote = {
    noteNumber?: string;
    title?: string;
    components: {
        name: string;
        fromVersion?: string;
        toVersion?: string;
    }[];
    cves: string[];
    cvssScore?: number;
    cvssVector?: string;
    priority?: string;
    correction?: string;
    confidence: number;
};

export function extractSapNoteFields(
    text: string
): ExtractedNote {
    const components: ExtractedNote["components"] = [];
    const cves = new Set<string>();
    let confidence = 0;

    // ─── NOTE NUMBER ───
    const noteNumber = text.match(/SAP Note\s+(\d{6,7})/)?.[1];
    if (noteNumber) confidence += 10;

    // ─── TITLE ───
    const title =
        text.match(/SAP Note\s+\d{6,7}\s*-\s*(.+)/)?.[1]?.trim() ||
        text.match(/Title\s*:\s*(.+)/i)?.[1]?.trim();
    if (title) confidence += 5;

    // ─── CVEs ───
    for (const cve of text.matchAll(/CVE-\d{4}-\d{4,7}/g)) {
        cves.add(cve[0]);
    }
    if (cves.size) confidence += 10;

    // ─── CVSS ───
    const cvssScore =
        text.match(/CVSS\s*Score\s*[:=]\s*([\d.]+)/)?.[1];
    const cvssVector =
        text.match(/CVSS\s*Vector\s*[:=]\s*([A-Z:\/0-9]+)/)?.[1];
    if (cvssScore) confidence += 10;

    // ─── AFFECTED COMPONENTS SECTION ───
    const affectedSection = extractSection(
        text,
        /Affected\s+Components?/i,
        /Symptoms|Solution|Reason/i
    );

    if (affectedSection) {
        confidence += 20;

        const componentRegex =
            /([A-Z][A-Z0-9_-]+)[^\n]*?([\d.]+)\s*-\s*([\d.]+)/g;

        let match;
        while ((match = componentRegex.exec(affectedSection))) {
            components.push({
                name: match[1],
                fromVersion: match[2],
                toVersion: match[3],
            });
        }
    }

    // ─── PRIORITY ───
    const priority =
        text.match(/Priority\s*:\s*(Hot\s*News|High|Medium|Low)/i)?.[1];
    if (priority) confidence += 10;

    // ─── CORRECTION INSTRUCTION ───
    const correction = extractSection(
        text,
        /Correction\s+Instructions?/i,
        /Support\s+Packages?|References/i
    ) ?? undefined;
    if (correction) confidence += 10;

    return {
        noteNumber,
        title,
        components,
        cves: Array.from(cves),
        cvssScore: cvssScore ? parseFloat(cvssScore) : undefined,
        cvssVector,
        priority,
        correction,
        confidence,
    };
}
