import { extractSection } from "./sectionExtractor";

export type ExtractedNote = {
    noteNumber?: string;
    title?: string;

    components: {
        name: string;
        fromVersion?: string;
        toVersion?: string;
    }[];

    supportPackages: {
        component: string;
        version: string;
        supportPackage: string;
    }[];

    cves: string[];
    cvssScore?: number;
    cvssVector?: string;
    priority?: string;
    correction?: string;

    confidence: number;
};

/* ===============================
   INLINE COMPONENT EXTRACTION
================================ */
function extractInlineComponents(text: string) {
    const results: ExtractedNote["components"] = [];

    const regex =
        /Component:\s*([A-Z0-9_-]+)[\s\S]{0,120}?(?:Version|Release):\s*([0-9.]+)/gi;

    let match;

    while ((match = regex.exec(text))) {
        results.push({
            name: match[1],
            fromVersion: match[2],
            toVersion: match[2],
        });
    }

    return results;
}

/* ===============================
   STRUCTURED TABLE EXTRACTION
================================ */
function extractStructuredComponents(text: string) {
    const results: ExtractedNote["components"] = [];

    const section = extractSection(
        text,
        /Software\s+Components?/i,
        /Correction\s+Instructions?|Support\s+Package|Prerequisites/i
    );

    if (!section) return results;

    const lineRegex =
        /^([A-Z0-9_-]+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/gm;

    let match;

    while ((match = lineRegex.exec(section))) {
        results.push({
            name: match[1],
            fromVersion: match[2],
            toVersion: match[3],
        });
    }

    return results;
}

/* ===============================
   SUPPORT PACKAGE EXTRACTION
================================ */
function extractSupportPackages(text: string) {
    const results: ExtractedNote["supportPackages"] = [];

    const section = extractSection(
        text,
        /Support\s+Package/i,
        /References|This\s+document\s+refers/i
    );

    if (!section) return results;

    const regex =
        /^([A-Z0-9_-]+)\s+(\d+(?:\.\d+)?)\s+(SAPK-[A-Z0-9]+)/gm;

    let match;

    while ((match = regex.exec(section))) {
        results.push({
            component: match[1],
            version: match[2],
            supportPackage: match[3],
        });
    }

    return results;
}

/* ===============================
   MERGE COMPONENT RESULTS
================================ */
function mergeComponents(
    ...arrays: ExtractedNote["components"][]
): ExtractedNote["components"] {
    const map = new Map<string, ExtractedNote["components"][number]>();

    arrays.flat().forEach((c) => {
        if (!map.has(c.name)) {
            map.set(c.name, c);
        }
    });

    return Array.from(map.values());
}

/* ===============================
   MAIN EXTRACTOR
================================ */
export function extractSapNoteFields(text: string): ExtractedNote {
    let confidence = 0;

    const noteNumber =
        text.match(/^(\d{6,7})\s*-/m)?.[1] ||
        text.match(/SAP\s+Note\s+(\d{6,7})/i)?.[1];

    if (noteNumber) confidence += 20;

    const title =
        text.match(/^\d{6,7}\s*-\s*(.+)/m)?.[1]?.trim();

    if (title) confidence += 10;

    const cves = new Set<string>();
    for (const cve of text.matchAll(/CVE-\d{4}-\d{4,7}/g)) {
        cves.add(cve[0]);
    }
    if (cves.size > 0) confidence += 10;

    const cvssScoreStr =
        text.match(/CVSS\s*Score\s*[:=]\s*([\d.]+)/i)?.[1];
    const cvssVector =
        text.match(/CVSS\s*Vector\s*[:=]\s*(CVSS:[^\s]+)/i)?.[1];

    const cvssScore = cvssScoreStr
        ? parseFloat(cvssScoreStr)
        : undefined;

    if (cvssScore) confidence += 10;

    const priority =
        text.match(/Priority\s*[:=]\s*(Hot\s*News|High|Medium|Low)/i)?.[1];

    if (priority) confidence += 5;

    const structured = extractStructuredComponents(text);
    const inline = extractInlineComponents(text);
    const components = mergeComponents(structured, inline);

    if (components.length > 0) confidence += 25;

    const supportPackages = extractSupportPackages(text);

    const correction =
        extractSection(
            text,
            /Correction\s+Instructions?/i,
            /Support\s+Package|References/i
        ) ?? undefined;

    return {
        noteNumber,
        title,
        components,
        supportPackages,
        cves: Array.from(cves),
        cvssScore,
        cvssVector,
        priority,
        correction,
        confidence,
    };
}
