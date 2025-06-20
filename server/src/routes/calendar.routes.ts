// src/routes/calendar.routes.ts
import express from 'express';
import { GoogleCalendarController } from '../controllers/google-calendar.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { calendarValidation } from '../validations/calendar.validation';
import GoogleCalendarService from '../services/google-calendar.service';

const router = express.Router();

const googleCalendarController = new GoogleCalendarController(new GoogleCalendarService());

// All routes require authentication
router.use(protect);

// Google Calendar connection routes
router.get('/status', GoogleCalendarController.getCalendarStatus);
// router.delete('/disconnect', CalendarController.disconnectCalendar);
// router.patch(
//   '/toggle-sync',
//   validateRequest(calendarValidation.toggleSync),
//   CalendarController.toggleCalendarSync
// );

// Calendar events routes
// router.get('/events', CalendarController.listEvents);
router.post(
  '/events',
  validateRequest(calendarValidation.createEvent),
  googleCalendarController.createEvent
);

// Meeting scheduling routes
// router.post(
//   '/available-slots',
//   validateRequest(calendarValidation.findSlots),
//   CalendarController.findAvailableMeetingSlots
// );

export default router;
