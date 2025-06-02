import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { authValidation } from '../validations/auth.validation';
import { AuthService } from '../services/auth.service';

const router = express.Router();

const authController = new AuthController(new AuthService());

// Public routes
router.post('/register', validateRequest(authValidation.register), authController.register);

router.post('/login', validateRequest(authValidation.login), authController.login);

router.post('/google', validateRequest(authValidation.googleAuth), authController.googleAuth);

router.get(
  '/verify-email/:token',
  validateRequest(authValidation.verifyEmail),
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPassword),
  authController.requestPasswordReset
);

router.post(
  '/reset-password/:token',
  validateRequest(authValidation.resetPassword),
  authController.resetPassword
);

// Protected routes
router.get('/me', protect, AuthController.getCurrentUser);

export default router;
