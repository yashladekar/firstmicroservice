import { Router } from "express";
import multer from "multer";
import FileController from "../controllers/FileController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), FileController.upload);
router.get("/files", FileController.listFiles);
router.get("/files/:id", FileController.getFile);


export default router;
