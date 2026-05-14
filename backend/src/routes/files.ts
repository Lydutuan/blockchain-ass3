import express from 'express';
import multer from 'multer';
import { uploadFile, getFileMeta } from '../controllers/fileController';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), uploadFile);
router.get('/:cid', getFileMeta);

export default router;
