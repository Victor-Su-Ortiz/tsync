import { Schema, model, Types } from "mongoose";
import { IAttendee, IEvent, IEventModel, IEventMethods } from "../types/event.types";

// Define the Event schema
const EventSchema = new Schema<IEvent, IEventModel, IEventMethods>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      virtual: Boolean,
      meetingLink: String,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event creator is required'],
    },
    eventDates: [
      {
        date: {
          type: Date,
          required: [true, 'Event date is required'],
        },
        isAllDay: {
          type: Boolean,
          default: false,
        },
        startTime: Date,
        endTime: Date,
      },
    ],
    timezone: {
      type: String,
      default: 'UTC',
    },
    recurrence: {
      pattern: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom'],
        default: 'none',
      },
      interval: Number,
      endDate: Date,
      endAfterOccurrences: Number,
      byDaysOfWeek: [Number],
      byDaysOfMonth: [Number],
      excludeDates: [Date],
    },
    googleCalendarEventId: String,
    googleCalendarId: String,
    status: {
      type: String,
      enum: ['scheduled', 'tentative', 'confirmed', 'cancelled'],
      default: 'scheduled',
    },
    attendees: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        email: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'declined', 'tentative'],
          default: 'pending',
        },
        responseTime: Date,
        responseMessage: String,
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private',
    },
    reminders: [
      {
        type: {
          type: String,
          enum: ['email', 'notification', 'both'],
          default: 'notification',
        },
        time: {
          type: Number, // Minutes before event
          default: 30,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
EventSchema.index({ creator: 1 });
EventSchema.index({ 'attendees.userId': 1 });
EventSchema.index({ 'eventDates.date': 1 });
EventSchema.index({ googleCalendarEventId: 1 });

// Methods
EventSchema.methods.getPublicEventData = function(): Partial<IEvent> {
  const eventObject = this.toObject();
  // Remove sensitive data or fields that shouldn't be exposed
  delete eventObject.googleCalendarEventId;
  delete eventObject.googleCalendarId;
  // Return only the necessary fields
  return eventObject;
};

EventSchema.methods.addAttendee = async function(userId: string, email: string): Promise<void> {
  // Check if attendee already exists
  const existingAttendee = this.attendees.find(
    (attendee) => attendee.userId.toString() === userId || attendee.email === email
  );
  
  if (!existingAttendee) {
    this.attendees.push({
      userId: new Types.ObjectId(userId),
      email,
      status: 'pending',
    });
    await this.save();
  }
};

EventSchema.methods.removeAttendee = async function(userId: string): Promise<void> {
  this.attendees = this.attendees.filter((attendee) => attendee.userId.toString() !== userId);
  await this.save();
};

EventSchema.methods.updateAttendeeStatus = async function(
  userId: string,
  status: IAttendee['status']
): Promise<void> {
  const attendee = this.attendees.find((a) => a.userId.toString() === userId);
  if (attendee) {
    attendee.status = status;
    attendee.responseTime = new Date();
    await this.save();
  }
};

// Static methods
EventSchema.statics.findEventsForUser = async function(userId: string) {
  return this.find({
    $or: [
      { creator: userId },
      { 'attendees.userId': userId },
    ],
  }).sort({ 'eventDates.date': 1 });
};

EventSchema.statics.findEventsByDateRange = async function(start: Date, end: Date) {
  return this.find({
    'eventDates.date': {
      $gte: start,
      $lte: end,
    },
  }).sort({ 'eventDates.date': 1 });
};

// Create and export the Event model
const Event = model<IEvent, IEventModel>('Event', EventSchema);
export default Event;