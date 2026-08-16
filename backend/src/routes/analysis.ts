import express from 'express';
import { analyzeDocument, getAnalysis, getAllAnalysis } from '../controllers/analysis';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/', getAllAnalysis);
router.post('/:documentId/analyze', analyzeDocument);
router.get('/:documentId', getAnalysis);

export default router;
