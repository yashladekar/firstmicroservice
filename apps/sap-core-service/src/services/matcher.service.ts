import prisma from "../config/db";
import { isVersionInRange } from "../utils/versionMatcher";

export async function runVulnerabilityScan() {
    type AbapComponentRow = {
        systemSid: string;
        component: string;
        release: string;
    };
    type JavaComponentRow = {
        systemSid: string;
        name: string;
        version: string;
    };

    // 1️⃣ Load installed components (ABAP + JAVA)
    const [abapComponents, javaComponents] = (await Promise.all([
        prisma.abapComponent.findMany({
            select: {
                systemSid: true,
                component: true,
                release: true,
            },
        }),
        prisma.javaComponent.findMany({
            select: {
                systemSid: true,
                name: true,
                version: true,
            },
        }),
    ])) as [AbapComponentRow[], JavaComponentRow[]];

    const components = [
        ...abapComponents.map((c) => ({
            systemId: c.systemSid,
            name: c.component,
            version: c.release,
        })),
        ...javaComponents.map((c) => ({
            systemId: c.systemSid,
            name: c.name,
            version: c.version,
        })),
    ];

    // 2️⃣ Load SAP Note components
    const noteComponents = await prisma.sapNoteComponent.findMany({
        include: {
            note: true,
        },
    });

    let matches = 0;

    for (const comp of components) {
        for (const noteComp of noteComponents) {
            if (comp.name !== noteComp.component) continue;

            if (
                isVersionInRange(
                    comp.version,
                    noteComp.fromVersion,
                    noteComp.toVersion
                )
            ) {
                await prisma.sapVulnerability.upsert({
                    where: {
                        systemId_componentName_noteId: {
                            systemId: comp.systemId,
                            componentName: comp.name,
                            noteId: noteComp.noteId,
                        },
                    },
                    update: {},
                    create: {
                        systemId: comp.systemId,
                        componentName: comp.name,
                        componentVersion: comp.version,
                        noteId: noteComp.noteId,
                        noteNumber: noteComp.note.noteNumber,
                        fromVersion: noteComp.fromVersion,
                        toVersion: noteComp.toVersion,
                    },
                });

                matches++;
            }
        }
    }

    return { matches };
}
