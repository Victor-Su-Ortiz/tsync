import { Types } from 'mongoose';
import { IEvent, IAttendee } from '../types/event.types';
import Event from '../models/event.model';
import User from '../models/user.model';
import { AppError } from '../utils/errors';

class EventService {
  /**
   * Create a new event
   */
  public async createEvent(eventData: Partial<IEvent>, userId: string): Promise<IEvent> {
    try {
      // Validate the creator exists
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Create the event
      const event = new Event({
        ...eventData,
        creator: userId,
      });

      // Add creator as an attendee automatically
      event.attendees.push({
        userId: new Types.ObjectId(userId),
        email: user.email,
        status: 'accepted',
        responseTime: new Date(),
      });

      // Save the event
      await event.save();
      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get an event by ID
   */
  public async getEventById(eventId: string, userId: string): Promise<IEvent> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check if user has permission to view this event
      if (
        event.visibility === 'private' &&
        event.creator.toString() !== userId &&
        !event.attendees.some(attendee => attendee.userId.toString() === userId)
      ) {
        throw new AppError('You do not have permission to view this event', 403);
      }

      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an event
   */
  public async updateEvent(
    eventId: string,
    eventData: Partial<IEvent>,
    userId: string
  ): Promise<IEvent> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check if user has permission to update this event
      if (event.creator.toString() !== userId) {
        throw new AppError('You do not have permission to update this event', 403);
      }

      // Update the event
      Object.assign(event, eventData);
      await event.save();

      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete an event
   */
  public async deleteEvent(eventId: string, userId: string): Promise<void> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check if user has permission to delete this event
      if (event.creator.toString() !== userId) {
        throw new AppError('You do not have permission to delete this event', 403);
      }

      await Event.findByIdAndDelete(eventId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all events for a user
   */
  public async getUserEvents(userId: string, query: any = {}): Promise<IEvent[]> {
    try {
      const { startDate, endDate, status } = query;
      
      // Base query
      const baseQuery: any = {
        $or: [
          { creator: userId },
          { 'attendees.userId': userId },
        ],
      };

      // Add date filtering if provided
      if (startDate || endDate) {
        baseQuery['eventDates.date'] = {};
        if (startDate) baseQuery['eventDates.date'].$gte = new Date(startDate);
        if (endDate) baseQuery['eventDates.date'].$lte = new Date(endDate);
      }

      // Add status filtering if provided
      if (status) {
        baseQuery.status = status;
      }

      return await Event.find(baseQuery).sort({ 'eventDates.date': 1 });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add an attendee to an event
   */
  public async addAttendee(
    eventId: string,
    attendeeData: { userId: string; email: string },
    currentUserId: string
  ): Promise<IEvent> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check if user has permission to add attendees
      if (event.creator.toString() !== currentUserId) {
        throw new AppError('You do not have permission to add attendees to this event', 403);
      }

      // Check if the user exists
      const user = await User.findById(attendeeData.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Add the attendee
      await event.addAttendee(attendeeData.userId, attendeeData.email);
      
      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update attendee status
   */
  public async updateAttendeeStatus(
    eventId: string,
    status: IAttendee['status'],
    userId: string
  ): Promise<IEvent> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check if user is an attendee
      const isAttendee = event.attendees.some(attendee => attendee.userId.toString() === userId);
      
      if (!isAttendee) {
        throw new AppError('You are not an attendee of this event', 403);
      }

      // Update the status
      await event.updateAttendeeStatus(userId, status);
      
      return event;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get upcoming events for a user
   */
  public async getUpcomingEvents(userId: string, limit: number = 5): Promise<IEvent[]> {
    try {
      const now = new Date();
      
      return await Event.find({
        $or: [
          { creator: userId },
          { 'attendees.userId': userId },
        ],
        'eventDates.date': { $gte: now },
        status: { $ne: 'cancelled' },
      })
        .sort({ 'eventDates.date': 1 })
        .limit(limit);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sync with Google Calendar
   * This is a placeholder for the actual Google Calendar integration
   */
  public async syncWithGoogleCalendar(eventId: string, userId: string): Promise<IEvent> {
    try {
      const event = await Event.findById(eventId);

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check if user has permission
      if (event.creator.toString() !== userId) {
        throw new AppError('You do not have permission to sync this event', 403);
      }

      // TODO: Implement actual Google Calendar integration
      // This would involve:
      // 1. Getting user's Google Calendar credentials
      // 2. Creating/updating the event in Google Calendar
      // 3. Storing the Google Calendar event ID

      // For now, just update a placeholder field
      event.googleCalendarEventId = 'placeholder-gc-event-id';
      event.googleCalendarId = 'placeholder-gc-id';
      
      await event.save();
      
      return event;
    } catch (error) {
      throw error;
    }
  }
}

export default new EventService();