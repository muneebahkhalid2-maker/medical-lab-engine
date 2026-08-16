import express from 'express';
import { register, login, logout, getMe } from '../controllers/auth';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
