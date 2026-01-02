import { Router } from "express";
import multer from "multer";
import { uploadSapNote } from "../controllers/upload.controller";

const router = Router();
const upload = multer({ dest: "uploads/notes/" });

router.post("/upload", upload.single("file"), uploadSapNote);

export default router;
