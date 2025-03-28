import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { eventValidation } from '../validations/event.validation';

const router = Router();

// Protect all routes
router.use(protect);

// Event routes
router
  .route('/')
  .get(EventController.getUserEvents)
  .post(validateRequest(eventValidation.createEvent), EventController.createEvent);

// Upcoming events
router.get('/upcoming', EventController.getUpcomingEvents);

// Single event routes
router
  .route('/:id')
  .get(EventController.getEvent)
  .patch(validateRequest(eventValidation.updateEvent), EventController.updateEvent)
  .delete(EventController.deleteEvent);

// Attendee management
router.post(
  '/:id/attendees',
  validateRequest(eventValidation.addAttendee),
  EventController.addAttendee
);

router.patch(
  '/:id/attendees/status',
  validateRequest(eventValidation.updateAttendeeStatus),
  EventController.updateAttendeeStatus
);

// Google Calendar integration
router.post('/:id/sync-google', EventController.syncWithGoogleCalendar);

export default router;
