import prisma from "../config/db";
import { isVersionInRange } from "../utils/versionMatcher";

function extractSPNumber(sp?: string) {
    if (!sp) return null;
    const match = sp.match(/SAPK-\d+(\d+)/);
    return match ? Number(match[1]) : null;
}

export async function matchNoteAgainstSystems(noteId: string) {
    const note = await prisma.sapNote.findUnique({
        where: { id: noteId },
        include: { components: true },
    });

    if (!note) return;

    const systems = await prisma.system.findMany({
        include: { abapComponents: true },
    });

    for (const system of systems) {
        await matchNoteWithSystem(note, system);
    }
}

export async function matchSystemAgainstNotes(systemSid: string) {
    const system = await prisma.system.findUnique({
        where: { sid: systemSid },
        include: { abapComponents: true },
    });

    if (!system) return;

    const notes = await prisma.sapNote.findMany({
        include: { components: true },
    });

    for (const note of notes) {
        await matchNoteWithSystem(note, system);
    }
}

async function matchNoteWithSystem(note: any, system: any) {
    for (const comp of system.abapComponents) {
        for (const noteComp of note.components) {

            if (noteComp.component !== comp.component) continue;

            let vulnerable = false;

            // RANGE MATCH
            if (
                noteComp.fromVersion &&
                noteComp.toVersion &&
                isVersionInRange(
                    comp.release,
                    noteComp.fromVersion,
                    noteComp.toVersion
                )
            ) {
                vulnerable = true;
            }

            // SINGLE VERSION MATCH
            if (
                !vulnerable &&
                noteComp.fromVersion &&
                !noteComp.toVersion &&
                comp.release === noteComp.fromVersion
            ) {
                vulnerable = true;
            }

            // SUPPORT PACKAGE MATCH
            if (!vulnerable && noteComp.fixedInSp && comp.supportPackage) {
                const fixSP = extractSPNumber(noteComp.fixedInSp);
                const installedSP = extractSPNumber(comp.supportPackage);

                if (
                    fixSP !== null &&
                    installedSP !== null &&
                    installedSP < fixSP
                ) {
                    vulnerable = true;
                }
            }

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
            } catch { }
        }
    }
}
