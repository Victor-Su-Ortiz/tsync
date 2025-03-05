import { Request, Response, NextFunction } from 'express';
import eventService from '../services/event.service';

class EventController {
  /**
   * Create a new event
   * @route POST /api/events
   */
  public createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      eventService.createEvent(req.body, userId.toString())
        .then(event => {
          res.status(201).json({
            status: 'success',
            data: {
              event,
            },
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get an event by ID
   * @route GET /api/events/:id
   */
  public getEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      eventService.getEventById(req.params.id, userId.toString())
        .then(event => {
          res.status(200).json({
            status: 'success',
            data: {
              event,
            },
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an event
   * @route PATCH /api/events/:id
   */
  public updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      eventService.updateEvent(req.params.id, req.body, userId.toString())
        .then(event => {
          res.status(200).json({
            status: 'success',
            data: {
              event,
            },
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an event
   * @route DELETE /api/events/:id
   */
  public deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      eventService.deleteEvent(req.params.id, userId.toString())
        .then(() => {
          res.status(204).json({
            status: 'success',
            data: null,
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all events for the authenticated user
   * @route GET /api/events
   */
  public getUserEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      eventService.getUserEvents(userId.toString(), req.query)
        .then(events => {
          res.status(200).json({
            status: 'success',
            results: events.length,
            data: {
              events,
            },
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add an attendee to an event
   * @route POST /api/events/:id/attendees
   */
  public addAttendee(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      const { attendeeId, email } = req.body;
      
      eventService.addAttendee(
        req.params.id,
        { userId: attendeeId, email },
        userId.toString()
      )
        .then(event => {
          res.status(200).json({
            status: 'success',
            data: {
              event,
            },
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update attendee status
   * @route PATCH /api/events/:id/attendees/status
   */
  public updateAttendeeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      const { status } = req.body;
      
      eventService.updateAttendeeStatus(req.params.id, status, userId.toString())
        .then(event => {
          res.status(200).json({
            status: 'success',
            data: {
              event,
            },
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming events
   * @route GET /api/events/upcoming
   */
  public getUpcomingEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      eventService.getUpcomingEvents(userId.toString(), limit)
        .then(events => {
          res.status(200).json({
            status: 'success',
            results: events.length,
            data: {
              events,
            },
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync event with Google Calendar
   * @route POST /api/events/:id/sync-google
   */
  public syncWithGoogleCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Not authenticated'
        });
      }

      eventService.syncWithGoogleCalendar(req.params.id, userId.toString())
        .then(event => {
          res.status(200).json({
            status: 'success',
            data: {
              event,
            },
          });
        })
        .catch(error => next(error));
    } catch (error) {
      next(error);
    }
  }
}

export default new EventController();