// src/routes/notification.routes.ts
import express from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { notificationValidation } from '../validations/notification.validation';
import { NotificationService } from '../services/notification.service';

const router = express.Router();

const notificationController = new NotificationController(new NotificationService());

// All notification routes are protected
router.use(protect);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Mark notifications as read
router.patch(
  '/read',
  validateRequest(notificationValidation.markAsRead),
  notificationController.markAsRead
);

// Delete notifications
router.delete(
  '/',
  validateRequest(notificationValidation.deleteNotifications),
  notificationController.deleteNotifications
);

export default router;
