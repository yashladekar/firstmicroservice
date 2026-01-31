import prisma from "../config/db";

/**
 * Maps SAP Note components to installed system components.
 * This is DOMAIN KNOWLEDGE — not a hack.
 */
const COMPONENT_MAP: Record<string, string[]> = {
    // ABAP framework → BASIS
    SAP_GWFND: ["SAP_BASIS"],
    SAP_UI: ["SAP_UI"],
    SAP_BASIS: ["SAP_BASIS"],

    // HR
    PA_ER: ["SAP_HR"],
    S4ERECRT: ["SAP_HR"],

    // Java
    ENGINEAPI: ["ENGINEAPI"],
    EP_BASIS: ["EP-BASIS"],
};

/**
 * Check if two version ranges overlap
 */
function versionOverlaps(
    noteFrom?: string,
    noteTo?: string,
    systemVersion?: string
): boolean {
    if (!systemVersion) return false;

    const sys = Number(systemVersion);
    if (Number.isNaN(sys)) return false;

    const from = noteFrom ? Number(noteFrom) : undefined;
    const to = noteTo ? Number(noteTo) : undefined;

    if (from && to) return sys >= from && sys <= to;
    if (from) return sys >= from;
    if (to) return sys <= to;

    return false;
}

/**
 * MAIN MATCHER
 */
export async function matchSapNotesForSystem(systemSid: string) {
    /**
     * 1️⃣ Load system inventory
     * (ABAP + JAVA components)
     */
    const system = await prisma.system.findUnique({
        where: { sid: systemSid },
        include: {
            abapComponents: true,
            javaComponents: true,
        },
    });

    if (!system) {
        throw new Error(`System ${systemSid} not found`);
    }

    /**
     * 2️⃣ Load ALL SAP Notes with components
     */
    const notes = await prisma.sapNote.findMany({
        include: {
            components: true,
        },
    });

    const matches: any[] = [];

    /**
     * 3️⃣ Iterate notes → components → system
     */
    for (const note of notes) {
        for (const noteComponent of note.components) {
            /**
             * 🚫 Client-only vulnerabilities are ignored
             */
            if (noteComponent.stack === "CLIENT") {
                continue;
            }

            /**
             * 4️⃣ ABAP STACK MATCHING
             */
            if (noteComponent.stack === "ABAP") {
                const mappedTargets =
                    COMPONENT_MAP[noteComponent.component] ?? [];

                for (const abap of system.abapComponents) {
                    if (!mappedTargets.includes(abap.component)) continue;

                    if (
                        versionOverlaps(
                            noteComponent.fromVersion,
                            noteComponent.toVersion,
                            abap.release
                        )
                    ) {
                        matches.push({
                            systemSid,
                            sapNote: note.noteNumber,
                            component: noteComponent.component,
                            stack: "ABAP",
                            systemComponent: abap.component,
                            systemVersion: abap.release,
                            cvss: note.cvssScore,
                        });
                    }
                }
            }

            /**
             * 5️⃣ JAVA STACK MATCHING
             */
            if (noteComponent.stack === "JAVA") {
                for (const java of system.javaComponents) {
                    if (
                        versionOverlaps(
                            noteComponent.fromVersion,
                            noteComponent.toVersion,
                            java.version
                        )
                    ) {
                        matches.push({
                            systemSid,
                            sapNote: note.noteNumber,
                            component: noteComponent.component,
                            stack: "JAVA",
                            systemComponent: java.name,
                            systemVersion: java.version,
                            cvss: note.cvssScore,
                        });
                    }
                }
            }
        }
    }

    return matches;
}
