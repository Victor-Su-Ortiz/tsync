// src/routes/notification.routes.ts
import express from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { notificationValidation } from '../validations/notification.validation';

const router = express.Router();

// All notification routes are protected
router.use(protect);

// Get user notifications
router.get('/', NotificationController.getUserNotifications);

// Mark notifications as read
router.patch(
  '/read',
  validateRequest(notificationValidation.markAsRead),
  NotificationController.markAsRead
);

// Delete notifications
router.delete(
  '/',
  validateRequest(notificationValidation.deleteNotifications),
  NotificationController.deleteNotifications
);

export default router;