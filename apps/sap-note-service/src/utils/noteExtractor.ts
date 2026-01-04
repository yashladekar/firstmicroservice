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

export function extractSapNoteFields(text: string): ExtractedNote {
    let confidence = 0;

    // ─────────────────────────────────────────────
    // NOTE NUMBER
    // Example: "3426825 - [CVE-2025-23191]"
    // ─────────────────────────────────────────────
    const noteNumber =
        text.match(/^(\d{6,7})\s*-/m)?.[1] ||
        text.match(/SAP\s+Note\s+(\d{6,7})/i)?.[1];

    if (noteNumber) confidence += 20;

    // ─────────────────────────────────────────────
    // TITLE
    // Example:
    // "3426825 - Cache Poisoning through header manipulation"
    // ─────────────────────────────────────────────
    const title =
        text.match(/^\d{6,7}\s*-\s*(.+)/m)?.[1]?.trim();

    if (title) confidence += 10;

    // ─────────────────────────────────────────────
    // CVEs
    // ─────────────────────────────────────────────
    const cves = new Set<string>();
    for (const cve of text.matchAll(/CVE-\d{4}-\d{4,7}/g)) {
        cves.add(cve[0]);
    }
    if (cves.size > 0) confidence += 10;

    // ─────────────────────────────────────────────
    // CVSS
    // ─────────────────────────────────────────────
    const cvssScoreStr =
        text.match(/CVSS\s*Score\s*[:=]\s*([\d.]+)/i)?.[1];
    const cvssVector =
        text.match(/CVSS\s*Vector\s*[:=]\s*(CVSS:[^\s]+)/i)?.[1];

    const cvssScore = cvssScoreStr
        ? parseFloat(cvssScoreStr)
        : undefined;

    if (cvssScore) confidence += 10;

    // ─────────────────────────────────────────────
    // PRIORITY (sometimes absent)
    // ─────────────────────────────────────────────
    const priority =
        text.match(/Priority\s*[:=]\s*(Hot\s*News|High|Medium|Low)/i)?.[1];

    if (priority) confidence += 5;

    // ─────────────────────────────────────────────
    // SOFTWARE COMPONENTS (CORE SECTION)
    // SAP FORMAT:
    // SAP_GWFND 740 740
    // ─────────────────────────────────────────────
    const components: ExtractedNote["components"] = [];

    const softwareComponentsSection = extractSection(
        text,
        /Software\s+Components?/i,
        /Correction\s+Instructions?|Support\s+Package|Prerequisites/i
    );

    if (softwareComponentsSection) {
        confidence += 25;

        const lineRegex =
            /^([A-Z0-9_-]+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/gm;

        let match;
        while ((match = lineRegex.exec(softwareComponentsSection))) {
            components.push({
                name: match[1],
                fromVersion: match[2],
                toVersion: match[3],
            });
        }
    }

    // ─────────────────────────────────────────────
    // SUPPORT PACKAGES (REMEDIATION GOLD)
    // Example:
    // SAP_GWFND 740 SAPK-74033INSAPGWFND
    // ─────────────────────────────────────────────
    const supportPackages: ExtractedNote["supportPackages"] = [];

    const supportPackageSection = extractSection(
        text,
        /Support\s+Package/i,
        /References|This\s+document\s+refers/i
    );

    if (supportPackageSection) {
        confidence += 10;

        const spRegex =
            /^([A-Z0-9_-]+)\s+(\d+(?:\.\d+)?)\s+(SAPK-[A-Z0-9]+)/gm;

        let match;
        while ((match = spRegex.exec(supportPackageSection))) {
            supportPackages.push({
                component: match[1],
                version: match[2],
                supportPackage: match[3],
            });
        }
    }

    // ─────────────────────────────────────────────
    // CORRECTION INSTRUCTIONS (RAW TEXT)
    // ─────────────────────────────────────────────
    const correction =
        extractSection(
            text,
            /Correction\s+Instructions?/i,
            /Support\s+Package|References/i
        ) ?? undefined;

    if (correction) confidence += 5;

    // ─────────────────────────────────────────────
    // FINAL RESULT
    // ─────────────────────────────────────────────
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
