import { Router } from "express";
import { upload } from "../config/multer";
import { uploadFile, getStatus } from "../controllers/uploadController";

const router = Router();

router.post("/upload", upload.single("file"), uploadFile);
router.get("/status/:id", getStatus);

export default router;