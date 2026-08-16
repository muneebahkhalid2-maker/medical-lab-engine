import { Router } from 'express';
import { getPatients, createPatient } from '../controllers/patients';

const router = Router();

router.get('/', getPatients);
router.post('/', createPatient);

export default router;
