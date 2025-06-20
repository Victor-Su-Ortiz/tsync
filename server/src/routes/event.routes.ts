import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { eventValidation } from '../validations/event.validation';
import { EventService } from '../services/event.service';

const router = Router();

const eventController = new EventController(new EventService());

// Protect all routes
router.use(protect);

// Event routes
router
  .route('/')
  .get(eventController.getUserEvents)
  .post(validateRequest(eventValidation.createEvent), eventController.createEvent);

// Upcoming events
router.get('/upcoming', eventController.getUpcomingEvents);

// Single event routes
router
  .route('/:id')
  .get(eventController.getEvent)
  .patch(validateRequest(eventValidation.updateEvent), eventController.updateEvent)
  .delete(eventController.deleteEvent);

// Attendee management
router.post(
  '/:id/attendees',
  validateRequest(eventValidation.addAttendee),
  eventController.addAttendee
);

router.patch(
  '/:id/attendees/status',
  validateRequest(eventValidation.updateAttendeeStatus),
  eventController.updateAttendeeStatus
);

// Google Calendar integration
router.post('/:id/sync-google', eventController.syncWithGoogleCalendar);

export default router;
