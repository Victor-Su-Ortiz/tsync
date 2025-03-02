import { Request, Response, NextFunction } from 'express';
import eventService from '../services/event.service';
import { catchAsync } from '../utils/errors';

class EventController {
  /**
   * Create a new event
   * @route POST /api/events
   */
  public createEvent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.userId;
    const event = await eventService.createEvent(req.body, userId!.toString());
    
    res.status(201).json({
      status: 'success',
      data: {
        event,
      },
    });
  });

  /**
   * Get an event by ID
   * @route GET /api/events/:id
   */
  public getEvent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const event = await eventService.getEventById(req.params.id, userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
      },
    });
  });

  /**
   * Update an event
   * @route PATCH /api/events/:id
   */
  public updateEvent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const event = await eventService.updateEvent(req.params.id, req.body, userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
      },
    });
  });

  /**
   * Delete an event
   * @route DELETE /api/events/:id
   */
  public deleteEvent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    await eventService.deleteEvent(req.params.id, userId);
    
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

  /**
   * Get all events for the authenticated user
   * @route GET /api/events
   */
  public getUserEvents = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const events = await eventService.getUserEvents(userId, req.query);
    
    res.status(200).json({
      status: 'success',
      results: events.length,
      data: {
        events,
      },
    });
  });

  /**
   * Add an attendee to an event
   * @route POST /api/events/:id/attendees
   */
  public addAttendee = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { attendeeId, email } = req.body;
    
    const event = await eventService.addAttendee(
      req.params.id,
      { userId: attendeeId, email },
      userId
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
      },
    });
  });

  /**
   * Update attendee status
   * @route PATCH /api/events/:id/attendees/status
   */
  public updateAttendeeStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { status } = req.body;
    
    const event = await eventService.updateAttendeeStatus(req.params.id, status, userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
      },
    });
  });

  /**
   * Get upcoming events
   * @route GET /api/events/upcoming
   */
  public getUpcomingEvents = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    
    const events = await eventService.getUpcomingEvents(userId, limit);
    
    res.status(200).json({
      status: 'success',
      results: events.length,
      data: {
        events,
      },
    });
  });

  /**
   * Sync event with Google Calendar
   * @route POST /api/events/:id/sync-google
   */
  public syncWithGoogleCalendar = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const event = await eventService.syncWithGoogleCalendar(req.params.id, userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
      },
    });
  });
}

export default new EventController();