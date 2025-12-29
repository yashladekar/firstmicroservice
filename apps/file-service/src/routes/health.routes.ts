import { Router } from "express";

const router = Router();

router.get("/", (req, res) => res.json({ status: "ok" }));
router.get("/live", (req, res) => res.json({ live: true }));
router.get("/ready", (req, res) => res.json({ ready: true }));

export default router;
