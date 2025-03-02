import { Router } from 'express';
import eventController from '../controllers/event.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(authenticate);

// Event routes
router.route('/')
  .get(eventController.getUserEvents)
  .post(eventController.createEvent);

// Upcoming events
router.get('/upcoming', eventController.getUpcomingEvents);

// Single event routes
router.route('/:id')
  .get(eventController.getEvent)
  .patch(eventController.updateEvent)
  .delete(eventController.deleteEvent);

// Attendee management
router.post('/:id/attendees', eventController.addAttendee);
router.patch('/:id/attendees/status', eventController.updateAttendeeStatus);

// Google Calendar integration
router.post('/:id/sync-google', eventController.syncWithGoogleCalendar);

export default router;