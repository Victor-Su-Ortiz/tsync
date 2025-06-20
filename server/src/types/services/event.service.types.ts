import { IEvent } from '../models/event.types';
import { IAttendee } from '../models/event.types';

export interface IEventService {
  createEvent(eventData: Partial<IEvent>, userId: string): Promise<IEvent>;
  getEventById(eventId: string, userId: string): Promise<IEvent>;
  updateEvent(eventId: string, eventData: Partial<IEvent>, userId: string): Promise<IEvent>;
  deleteEvent(eventId: string, userId: string): Promise<void>;
  getUserEvents(userId: string, query: any): Promise<IEvent[]>;
  addAttendee(eventId: string, attendeeData: IAddAttendee, userId: string): Promise<IEvent>;
  updateAttendeeStatus(
    eventId: string,
    status: IAttendee['status'],
    userId: string
  ): Promise<IEvent>;
  getUpcomingEvents(userId: string, limit: number): Promise<IEvent[]>;
  syncWithGoogleCalendar(eventId: string, userId: string): Promise<IEvent>;
}

export interface IAddAttendee {
  userId: string;
  email: string;
  name: string;
}
