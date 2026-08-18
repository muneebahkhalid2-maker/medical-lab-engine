import express from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  extractDocumentDetails,
  verifyDocumentData,
  processDocument,
  getExtractions
} from '../controllers/documents';
import { uploadMiddleware } from '../middlewares/upload';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

// Optional auth middleware (handles auth if provided, or allows pass-through)
const optionalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.headers.authorization) {
    return requireAuth(req, res, next);
  }
  next();
};

router.use(optionalAuth);

router.post('/upload', uploadMiddleware.single('document'), uploadDocument);
router.post('/', uploadMiddleware.single('document'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.post('/:id/extract', extractDocumentDetails);
router.post('/:id/verify', verifyDocumentData);
router.post('/:id/process', processDocument);
router.get('/:id/extractions', getExtractions);

export default router;
