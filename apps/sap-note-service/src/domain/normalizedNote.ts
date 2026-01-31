// domain/normalizedNote.ts
export interface NormalizedSapNote {
    sapNoteId: string;
    cve?: string;
    releasedOn?: Date;
    cvss?: number;

    components: {
        name: string;       // SAP_GWFND
        stack: 'ABAP' | 'JAVA' | 'CLIENT' | 'UNKNOWN';
        fromVersion?: string;
        toVersion?: string;
    }[];
}
