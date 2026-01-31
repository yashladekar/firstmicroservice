import { NormalizedSapNote } from "../domain/normalizedNote";

export function normalizeSapNote(rawText: string): NormalizedSapNote {
    const sapNoteId =
        rawText.match(/\b\d{7}\b/)?.[0] ?? "UNKNOWN";

    const cve =
        rawText.match(/CVE-\d{4}-\d+/)?.[0];

    const cvssMatch =
        rawText.match(/CVSS Score\s*:\s*([\d.]+)/);
    const cvss = cvssMatch ? Number(cvssMatch[1]) : undefined;

    const releasedOnMatch =
        rawText.match(/Released On:\s*(\d{2}\.\d{2}\.\d{4})/);
    const releasedOn = releasedOnMatch
        ? new Date(releasedOnMatch[1].split(".").reverse().join("-"))
        : undefined;

    const components: NormalizedSapNote["components"] = [];

    const componentRegex =
        /Software Component\s+([A-Z0-9_-]+)\s+(\d+)\s+(\d+)/g;

    let match;
    while ((match = componentRegex.exec(rawText)) !== null) {
        const name = match[1];

        components.push({
            name,
            stack: classifyStack(name),
            fromVersion: match[2],
            toVersion: match[3],
        });
    }

    return {
        sapNoteId,
        cve,
        cvss,
        releasedOn,
        components,
    };
}

function classifyStack(component: string): "ABAP" | "JAVA" | "CLIENT" | "UNKNOWN" {
    if (component.startsWith("SAP_")) return "ABAP";
    if (["ENGINEAPI", "EP-BASIS"].includes(component)) return "JAVA";
    if (component.startsWith("BC-FES")) return "CLIENT";
    return "UNKNOWN";
}
