import { Request, Response } from "express";
import { runVulnerabilityScan } from "../services/matcher.service";

export async function scan(req: Request, res: Response) {
    const result = await runVulnerabilityScan();
    res.json({
        status: "completed",
        matches: result.matches,
    });
}
