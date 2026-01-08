import { Request, Response } from "express";
import prisma from "../config/db";

export async function listSystems(req: Request, res: Response) {
    const systems = await prisma.system.findMany({
        select: {
            sid: true,
            mainProduct: true,
            dbVersion: true,
            osType: true,
            osVersion: true,
            updatedAt: true,
        },
    });

    res.json(systems);
}
