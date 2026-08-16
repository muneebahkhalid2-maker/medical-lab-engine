import express from 'express';
import { analyzeDocument, getAnalysis } from '../controllers/analysis';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.post('/:documentId/analyze', analyzeDocument);
router.get('/:documentId', getAnalysis);

export default router;
