import { Request, Response } from "express";
import prisma from "../config/db";

export async function vulnerabilitySummary(
    req: Request,
    res: Response
) {
    const summary = await prisma.sapVulnerability.groupBy({
        by: ["systemId"],
        _count: {
            _all: true,
        },
    });

    const systems = await prisma.system.findMany({
        where: {
            sid: { in: summary.map((s: (typeof summary)[number]) => s.systemId) },
        },
        select: {
            sid: true,
        },
    });

    const result = summary.map((s: (typeof summary)[number]) => {
        const system = systems.find(
            (sys: (typeof systems)[number]) => sys.sid === s.systemId
        );
        return {
            sid: system?.sid,
            vulnerabilities: s._count._all,
        };
    });

    res.json(result);
}
