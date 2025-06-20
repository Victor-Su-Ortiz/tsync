import { Document, Model, Types } from 'mongoose';
import { PublicUser } from './user.types';

// Define the possible event recurrence patterns
export type RecurrencePattern =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

// Define the possible event statuses
export type EventStatus = 'scheduled' | 'tentative' | 'confirmed' | 'cancelled';

// Define event date type to handle non-consecutive dates
export interface IEventDate {
  startDate: Date;
  endDate: Date;
  isAllDay?: boolean;
  startTime?: Date;
  endTime?: Date;
}

// Define attendee interface
export interface IAttendee {
  userId: Types.ObjectId;
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  responseTime?: Date;
  responseMessage?: string;
  name: string;
}

// Define reminder interface
export interface IReminder {
  type: 'email' | 'notification' | 'both';
  time: number; // Minutes before the event
}

// Interface to define the Event document structure
export interface IEvent extends Document {
  _id: Types.ObjectId;

  // Basic info
  title: string;
  description?: string;
  location?: {
    address?: string;
    name?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    virtual?: boolean;
    meetingLink?: string;
    metadata?: any;
  };

  // Creator and ownership
  creator: PublicUser; // Reference to User model

  // Time-related fields
  eventDates: IEventDate[]; // Support for non-consecutive dates
  timezone: string;
  duration: number; // Duration in minutes
  scheduledTime: Date;
  endTime: Date;

  // Recurrence
  recurrence?: {
    pattern: RecurrencePattern;
    interval?: number; // Every X days/weeks/months
    endDate?: Date;
    endAfterOccurrences?: number;
    byDaysOfWeek?: number[]; // 0-6 for Sunday-Saturday
    byDaysOfMonth?: number[]; // 1-31
    excludeDates?: Date[];
  };

  // Integration with Google Calendar
  googleCalendarEventId?: string;
  googleCalendarId?: string;

  // Ask users to automatically sync with Google Calendar
  sync: boolean;

  // Status
  status: EventStatus;

  // Attendees
  attendees: IAttendee[];

  // Visibility and privacy
  visibility: 'public' | 'private' | 'friends';

  // Reminders
  reminders: IReminder[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventMethods {
  getPublicEventData(): Partial<IEvent>;
  addAttendee(userId: string, email: string, name: string): Promise<void>;
  removeAttendee(userId: string): Promise<void>;
  updateAttendeeStatus(userId: string, status: IAttendee['status']): Promise<void>;
  syncWithGoogleCalendar(): Promise<void>;
}

export interface IEventModel extends Model<IEvent, {}, IEventMethods> {
  findEventsForUser(
    userId: string
  ): Promise<Array<Document<unknown, any, IEvent> & IEvent & IEventMethods>>;
  findEventsByDateRange(
    start: Date,
    end: Date
  ): Promise<Array<Document<unknown, any, IEvent> & IEvent & IEventMethods>>;
}
