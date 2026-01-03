import { Request, Response } from "express";
import prisma from "../config/db";

export async function listSystems(req: Request, res: Response) {
    const systems = await prisma.system.findMany({
        select: {
            id: true,
            sid: true,
            landscape: true,
            vendor: true,
            location: true,
        },
    });

    res.json(systems);
}
