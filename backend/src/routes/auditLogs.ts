import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogs';

const router = Router();

router.get('/', getAuditLogs);

export default router;
