import { Router } from 'express';
import multer from 'multer';
import { uploadFile } from '../controller/client-file-controller';

const router = Router();

// Configure Multer to save to a temp directory
const upload = multer({ dest: 'uploads/temp/' });

router.post('/upload', upload.single('file'), uploadFile);

export default router;