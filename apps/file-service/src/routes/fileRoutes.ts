import { Router } from "express";
import multer from "multer";
import FileController from "../controllers/FileController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/file/upload", upload.single("file"), FileController.upload);

export default router;
