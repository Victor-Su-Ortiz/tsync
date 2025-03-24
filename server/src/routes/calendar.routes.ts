// src/routes/calendar.routes.ts
import express from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { calendarValidation } from '../validations/calendar.validation';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Google Calendar connection routes
router.get('/auth-url', CalendarController.getAuthUrl);
router.get('/callback', CalendarController.handleAuthCallback);
router.get('/status', CalendarController.getCalendarStatus);
router.delete('/disconnect', CalendarController.disconnectCalendar);
router.patch(
  '/toggle-sync',
  validateRequest(calendarValidation.toggleSync),
  CalendarController.toggleCalendarSync
);

// Calendar events routes
router.get('/events', CalendarController.listEvents);
router.post(
  '/events',
  validateRequest(calendarValidation.createEvent),
  CalendarController.createEvent
);

// Meeting scheduling routes
router.post(
  '/available-slots',
  validateRequest(calendarValidation.findSlots),
  CalendarController.findAvailableMeetingSlots
);

export default router;
