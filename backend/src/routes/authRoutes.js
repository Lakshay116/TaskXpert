import express from 'express';
import { register, login, refreshToken, googleLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/google', googleLogin);

export default router;
