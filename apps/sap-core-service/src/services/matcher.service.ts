import prisma from "../config/db";
import { isVersionInRange } from "../utils/versionMatcher";

/**
 * Extract numeric SP value from SAPK string
 * Example:
 * SAPK-75015INSAPBASIS → 15
 */
function extractSPNumber(sp?: string | null): number | null {
    if (!sp) return null;

    const match = sp.match(/SAPK-\d+(\d+)/);
    if (!match) return null;

    return Number(match[1]);
}

/**
 * Core vulnerability decision logic
 */
function isComponentVulnerable(
    installedRelease: string,
    installedSP?: string | null,
    noteFrom?: string | null,
    noteTo?: string | null,
    noteFixSP?: string | null
): boolean {

    /* =========================
       LEVEL 1 — RANGE MATCH
    ========================= */
    if (noteFrom && noteTo) {
        if (isVersionInRange(installedRelease, noteFrom, noteTo)) {
            return true;
        }
    }

    /* =========================
       LEVEL 2 — SINGLE VERSION
    ========================= */
    if (noteFrom && !noteTo) {
        if (installedRelease === noteFrom) {
            return true;
        }
    }

    /* =========================
       LEVEL 3 — SUPPORT PACKAGE
    ========================= */
    if (noteFixSP && installedSP) {
        const fixSP = extractSPNumber(noteFixSP);
        const installedSPNum = extractSPNumber(installedSP);

        if (
            fixSP !== null &&
            installedSPNum !== null &&
            installedSPNum < fixSP
        ) {
            return true;
        }
    }

    return false;
}

/**
 * FULL SYSTEM SCAN
 * (Fallback / manual trigger / safety net)
 */
export async function runVulnerabilityScan() {

    const systems = await prisma.system.findMany({
        include: {
            abapComponents: true,
        },
    });

    const notes = await prisma.sapNote.findMany({
        include: {
            components: true,
        },
    });

    let matches = 0;

    for (const system of systems) {
        for (const comp of system.abapComponents) {

            for (const note of notes) {
                for (const noteComp of note.components) {

                    /* COMPONENT NAME MUST MATCH */
                    if (noteComp.component !== comp.component) continue;

                    const vulnerable = isComponentVulnerable(
                        comp.release,
                        comp.supportPackage,
                        noteComp.fromVersion,
                        noteComp.toVersion,
                        noteComp.fixedInSp
                    );

                    if (!vulnerable) continue;

                    try {
                        await prisma.sapVulnerability.create({
                            data: {
                                systemId: system.sid,
                                componentName: comp.component,
                                componentVersion: comp.release,
                                noteId: note.id,
                                noteNumber: note.noteNumber,
                                fromVersion: noteComp.fromVersion,
                                toVersion: noteComp.toVersion,
                            },
                        });

                        matches++;

                    } catch (err) {
                        /**
                         * Ignore duplicates safely
                         * Unique constraint:
                         * systemId + componentName + noteId
                         */
                    }
                }
            }
        }
    }

    return {
        status: "completed",
        matches,
        systemsScanned: systems.length,
        notesEvaluated: notes.length,
    };
}
