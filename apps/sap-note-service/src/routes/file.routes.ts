import { Router } from "express";
import multer from "multer";
import { uploadSapNote } from "../controllers/upload.controller";

const router = Router();
const upload = multer({ dest: "uploads/notes/" });

router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "sap-note-service" });
});

router.post("/upload", upload.single("file"), uploadSapNote);

export default router;
