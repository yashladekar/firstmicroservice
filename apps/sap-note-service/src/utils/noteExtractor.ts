export function extractSapNoteFields(text: string) {
    const noteNumber =
        text.match(/SAP Note\s+(\d{6,7})/)?.[1];

    const cve =
        text.match(/CVE-\d{4}-\d{4,7}/)?.[0];

    const component =
        text.match(/Component\s*:\s*([A-Z0-9_-]+)/)?.[1];

    const versionRange =
        text.match(/Versions?\s*:\s*([\d.]+)\s*-\s*([\d.]+)/);

    const cvss =
        text.match(/CVSS\s*Score\s*:\s*([\d.]+)/)?.[1];

    const priority =
        text.match(/Priority\s*:\s*(Hot News|High|Medium|Low)/)?.[1];

    return {
        noteNumber,
        cve,
        component,
        fromVersion: versionRange?.[1],
        toVersion: versionRange?.[2],
        cvssScore: cvss ? parseFloat(cvss) : undefined,
        priority,
    };
}
