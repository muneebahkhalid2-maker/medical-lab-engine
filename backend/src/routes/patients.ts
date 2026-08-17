import { Router } from 'express';
import { getPatients, getPatientById, createPatient, updateEncounterStatus } from '../controllers/patients';

const router = Router();

router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.patch('/:id/status', updateEncounterStatus);

export default router;
