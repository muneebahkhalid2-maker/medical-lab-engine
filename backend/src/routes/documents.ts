import express from 'express';
import multer from 'multer';
import { uploadDocument, getDocuments, getDocument, processDocument, getExtractions } from '../controllers/documents';
import { requireAuth } from '../middlewares/auth';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.use(requireAuth);

router.post('/', upload.single('document'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.post('/:id/process', processDocument);
router.get('/:id/extractions', getExtractions);

export default router;
