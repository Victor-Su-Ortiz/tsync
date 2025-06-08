import { Request, Response, NextFunction } from 'express';
import { IEventService } from '../types/services-types/event.service.types';
import eventService from '../services/event.service';

export class EventController {
  /**
   * EventController handles event-related requests.
   * It provides methods for creating, retrieving, updating, deleting events,
   * managing attendees, and syncing with Google Calendar.
   */
  eventService: IEventService;
  constructor(eventService: IEventService) {
    this.eventService = eventService;
  /**
   * Create a new event
   * @route POST /api/events
   */
  static async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      const event = await eventService.createEvent(req.body, userId.toString());
      res.status(201).json({
        status: 'success',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get an event by ID
   * @route GET /api/events/:id
   */
  static async getEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      const event = await eventService.getEventById(req.params.id, userId.toString());
      res.status(200).json({
        status: 'success',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an event
   * @route PATCH /api/events/:id
   */
  static async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      const event = await eventService.updateEvent(req.params.id, req.body, userId.toString());

      res.status(200).json({
        status: 'success',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an event
   * @route DELETE /api/events/:id
   */
  static async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      await eventService.deleteEvent(req.params.id, userId.toString());
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all events for the authenticated user
   * @route GET /api/events
   */
  static async getUserEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      const events = await eventService.getUserEvents(userId.toString(), req.query);
      res.status(200).json({
        status: 'success',
        results: events.length,
        events,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add an attendee to an event
   * @route POST /api/events/:id/attendees
   */
  static async addAttendee(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      const { attendeeId, email, name } = req.body;

      const event = await eventService.addAttendee(
        req.params.id,
        { userId: attendeeId, email, name },
        userId.toString()
      );
      res.status(200).json({
        status: 'success',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update attendee status
   * @route PATCH /api/events/:id/attendees/status
   */
  static async updateAttendeeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      const { status } = req.body;

      const event = await eventService.updateAttendeeStatus(
        req.params.id,
        status,
        userId.toString()
      );

      res.status(200).json({
        status: 'success',
        event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming events
   * @route GET /api/events/upcoming
   */
  static async getUpcomingEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      const events = await eventService.getUpcomingEvents(userId.toString(), limit);

      res.status(200).json({
        status: 'success',
        results: events.length,
        events,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync event with Google Calendar
   * @route POST /api/events/:id/sync-google
   */
  static async syncWithGoogleCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          status: 'fail',
          message: 'Not authenticated',
        });
        return;
      }

      const event = await eventService.syncWithGoogleCalendar(req.params.id, userId.toString());

      res.status(200).json({
        status: 'success',
        data: {
          event,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
