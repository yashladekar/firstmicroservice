import { Router } from "express";
import { listSystems } from "../controllers/system.controller";
import { getSystemVulnerabilities } from "../controllers/vulnerability.controller";
import { vulnerabilitySummary } from "../controllers/summary.controller";

const router = Router();

router.get("/systems", listSystems);
router.get("/systems/:sid/vulnerabilities", getSystemVulnerabilities);
router.get("/vulnerabilities/summary", vulnerabilitySummary);

export default router;
