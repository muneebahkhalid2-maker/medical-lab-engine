import express from 'express';
import { updateExtraction, verifyAllExtractions } from '../controllers/extractions';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.patch('/:id', updateExtraction);
router.post('/document/:documentId/verify-all', verifyAllExtractions);

export default router;
