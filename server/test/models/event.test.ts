import { Document, Types } from 'mongoose';
import Event from '../../src/models/event.model';
import { IEvent, IEventModel, IEventMethods } from '../../src/types/event.types';
import { describe, it, afterEach, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { connect, disconnect, clear } from '../test-utils/test-database';

describe('Event Model Tests', () => {
  let eventDocument: Document<unknown, any, IEvent> & IEvent & IEventMethods;
  let userId: Types.ObjectId;
  let creatorId: Types.ObjectId;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await Event.deleteMany({});
  });

  beforeEach(async () => {
    userId = new Types.ObjectId();
    creatorId = new Types.ObjectId();
  });

  // Test event creation
  it('should create a new event successfully', async () => {
    const eventData = {
      title: 'Test Event',
      description: 'Test Description',
      location: {
        address: '123 Test St',
        name: 'Test Venue',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        virtual: false,
      },
      creator: creatorId,
      duration: 60,
      eventDates: [
        {
          startDate: new Date('2024-12-01T10:00:00Z'),
          endDate: new Date('2024-12-01T11:00:00Z'),
          isAllDay: false,
        },
      ],
      timezone: 'UTC',
      status: 'scheduled',
      visibility: 'private',
      sync: false,
      attendees: [],
      reminders: [
        {
          type: 'notification',
          time: 30,
        },
      ],
    };

    const event = await Event.create(eventData);

    expect(event).toBeDefined();
    expect(event.title).toBe(eventData.title);
    expect(event.description).toBe(eventData.description);
    expect(event.creator.toString()).toBe(creatorId.toString());
    expect(event.duration).toBe(eventData.duration);
    expect(event.status).toBe('scheduled');
    expect(event.visibility).toBe('private');
    expect(event.sync).toBe(false);
    expect(event.attendees).toEqual([]);
    expect(event.createdAt).toBeDefined();
    expect(event.updatedAt).toBeDefined();
  });

  // Schema validation tests
  describe('Schema Validation', () => {
    it('should require title', async () => {
      const eventData = {
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
      };

      await expect(Event.create(eventData)).rejects.toThrow('Event title is required');
    });

    it('should require creator', async () => {
      const eventData = {
        title: 'Test Event',
        duration: 60,
        eventDates: [
          {
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
      };

      await expect(Event.create(eventData)).rejects.toThrow('Event creator is required');
    });

    it('should require duration', async () => {
      const eventData = {
        title: 'Test Event',
        creator: creatorId,
        eventDates: [
          {
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
      };

      await expect(Event.create(eventData)).rejects.toThrow('Event duration is required');
    });

    it('should require event dates', async () => {
      const eventData = {
        title: 'Test Event',
        creator: creatorId,
        duration: 60,
        eventDates: [],
      };

      await expect(Event.create(eventData)).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const eventData = {
        title: 'Test Event',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
        status: 'invalid-status' as any,
      };

      await expect(Event.create(eventData)).rejects.toThrow();
    });

    it('should set default values', async () => {
      const event = await Event.create({
        title: 'Test Event',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
      });

      expect(event.timezone).toBe('UTC');
      expect(event.status).toBe('scheduled');
      expect(event.visibility).toBe('private');
      expect(event.sync).toBe(false);
      expect(event.recurrence?.pattern).toBe('none');
    });
  });

  // Test getPublicEventData method
  it('should return public event data without sensitive information', async () => {
    const event = await Event.create({
      title: 'Public Data Test',
      creator: creatorId,
      duration: 60,
      eventDates: [
        {
          startDate: new Date(),
          endDate: new Date(),
        },
      ],
      googleCalendarEventId: 'test-google-id',
      googleCalendarId: 'test-calendar-id',
    });

    const publicData = event.getPublicEventData();

    // Public data should include these fields
    expect(publicData.title).toBe('Public Data Test');
    expect(publicData.creator).toBeDefined();
    expect(publicData.duration).toBe(60);

    // Public data should NOT include these sensitive fields
    expect('googleCalendarEventId' in publicData).toBe(false);
    expect('googleCalendarId' in publicData).toBe(false);
  });

  // Attendee management tests
  describe('Attendee Management', () => {
    let event: Document<unknown, any, IEvent> & IEvent & IEventMethods;

    beforeEach(async () => {
      event = await Event.create({
        title: 'Attendee Test Event',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
      });
    });

    it('should add attendee successfully', async () => {
      await event.addAttendee(userId.toString(), 'test@example.com', 'Test User');

      // Reload event to get updated data
      const updatedEvent = await Event.findById(event._id);

      expect(updatedEvent?.attendees.length).toBe(1);
      expect(updatedEvent?.attendees[0].email).toBe('test@example.com');
      expect(updatedEvent?.attendees[0].status).toBe('pending');
      expect(updatedEvent?.attendees[0].name).toBe('Test User');
    });

    it('should not add duplicate attendee by userId', async () => {
      await event.addAttendee(userId.toString(), 'test@example.com', 'Test User');

      await event.addAttendee(userId.toString(), 'another@example.com', 'Another Name');

      const updatedEvent = await Event.findById(event._id);
      expect(updatedEvent?.attendees.length).toBe(1);
      expect(updatedEvent?.attendees[0].email).toBe('test@example.com');
    });

    it('should not add duplicate attendee by email', async () => {
      await event.addAttendee(userId.toString(), 'test@example.com', 'Test User');

      const anotherUserId = new Types.ObjectId();
      await event.addAttendee(anotherUserId.toString(), 'test@example.com', 'Another User');

      const updatedEvent = await Event.findById(event._id);
      expect(updatedEvent?.attendees.length).toBe(1);
      expect(updatedEvent?.attendees[0].userId.toString()).toBe(userId.toString());
    });

    it('should remove attendee successfully', async () => {
      await event.addAttendee(userId.toString(), 'test@example.com', 'Test User');

      await event.removeAttendee(userId.toString());

      const updatedEvent = await Event.findById(event._id);
      expect(updatedEvent?.attendees.length).toBe(0);
    });

    it('should handle removing non-existent attendee', async () => {
      await event.removeAttendee(userId.toString());

      const updatedEvent = await Event.findById(event._id);
      expect(updatedEvent?.attendees.length).toBe(0);
    });

    it('should update attendee status successfully', async () => {
      await event.addAttendee(userId.toString(), 'test@example.com', 'Test User');

      await event.updateAttendeeStatus(userId.toString(), 'accepted');

      const updatedEvent = await Event.findById(event._id);
      const attendee = updatedEvent?.attendees[0];

      expect(attendee?.status).toBe('accepted');
      expect(attendee?.responseTime).toBeDefined();
    });

    it('should handle updating non-existent attendee', async () => {
      await event.updateAttendeeStatus(userId.toString(), 'accepted');

      const updatedEvent = await Event.findById(event._id);
      expect(updatedEvent?.attendees.length).toBe(0);
    });
  });

  // Static method tests
  describe('Static Methods', () => {
    let event1: Document<unknown, any, IEvent> & IEvent & IEventMethods;
    let event2: Document<unknown, any, IEvent> & IEvent & IEventMethods;
    let event3: Document<unknown, any, IEvent> & IEvent & IEventMethods;

    beforeEach(async () => {
      // Create multiple events for testing
      event1 = await Event.create({
        title: 'Event 1',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-01'),
          },
        ],
        attendees: [
          {
            userId,
            email: 'test@example.com',
            name: 'Test User',
            status: 'pending',
          },
        ],
      });

      event2 = await Event.create({
        title: 'Event 2',
        creator: userId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2024-12-15'),
            endDate: new Date('2024-12-15'),
          },
        ],
      });

      event3 = await Event.create({
        title: 'Event 3',
        creator: new Types.ObjectId(),
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2024-12-25'),
            endDate: new Date('2024-12-25'),
          },
        ],
      });
    });

    it('should find events for user (creator)', async () => {
      const events = await Event.findEventsForUser(userId.toString());

      expect(events.length).toBeGreaterThan(0);
      const titles = events.map(e => e.title);
      expect(titles).toContain('Event 2');
    });

    it('should find events for user (attendee)', async () => {
      const events = await Event.findEventsForUser(userId.toString());

      const titles = events.map(e => e.title);
      expect(titles).toContain('Event 1');
    });

    it('should find events where user is both creator and attendee', async () => {
      await event2.addAttendee(userId.toString(), 'test@example.com', 'Test User');

      const events = await Event.findEventsForUser(userId.toString());

      expect(events.length).toBe(2);
    });

    it('should return empty array for user with no events', async () => {
      const newUserId = new Types.ObjectId();
      const events = await Event.findEventsForUser(newUserId.toString());

      expect(events).toEqual([]);
    });

    it('should sort events by date', async () => {
      const events = await Event.findEventsForUser(userId.toString());

      if (events.length > 1) {
        const dates = events.map(e => e.eventDates[0].startDate);
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i].getTime()).toBeLessThanOrEqual(dates[i + 1].getTime());
        }
      }
    });

    it('should find events within date range', async () => {
      const start = new Date('2024-12-10');
      const end = new Date('2024-12-20');

      const events = await Event.findEventsByDateRange(start, end);

      expect(events.length).toBe(1);
      expect(events[0].title).toBe('Event 2');
    });

    it('should include events on boundary dates', async () => {
      const start = new Date('2024-12-01');
      const end = new Date('2024-12-25');

      const events = await Event.findEventsByDateRange(start, end);

      expect(events.length).toBe(3);
    });

    it('should return empty array for date range with no events', async () => {
      const start = new Date('2024-11-01');
      const end = new Date('2024-11-30');

      const events = await Event.findEventsByDateRange(start, end);

      expect(events).toEqual([]);
    });
  });

  // Complex scenario tests
  describe('Complex Scenarios', () => {
    it('should handle events with multiple dates', async () => {
      const multiDateEvent = await Event.create({
        title: 'Multi-Date Event',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-01'),
          },
          {
            startDate: new Date('2024-12-08'),
            endDate: new Date('2024-12-08'),
          },
          {
            startDate: new Date('2024-12-15'),
            endDate: new Date('2024-12-15'),
          },
        ],
      });

      expect(multiDateEvent.eventDates).toHaveLength(3);
      expect(multiDateEvent.eventDates[0].startDate).toEqual(new Date('2024-12-01'));
    });

    it('should handle recurring events', async () => {
      const recurringEvent = await Event.create({
        title: 'Recurring Event',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-01'),
          },
        ],
        recurrence: {
          pattern: 'weekly',
          interval: 1,
          endDate: new Date('2024-12-31'),
          byDaysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        },
      });

      expect(recurringEvent.recurrence?.pattern).toBe('weekly');
      expect(recurringEvent.recurrence?.byDaysOfWeek).toEqual([1, 3, 5]);
      expect(recurringEvent.recurrence?.interval).toBe(1);
    });

    it('should handle virtual events', async () => {
      const virtualEvent = await Event.create({
        title: 'Virtual Event',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-01'),
          },
        ],
        location: {
          virtual: true,
          meetingLink: 'https://meet.example.com/abc123',
        },
      });

      expect(virtualEvent.location?.virtual).toBe(true);
      expect(virtualEvent.location?.meetingLink).toBe('https://meet.example.com/abc123');
    });

    it('should handle events with multiple reminders', async () => {
      const event = await Event.create({
        title: 'Event with Reminders',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-01'),
          },
        ],
        reminders: [
          {
            type: 'email',
            time: 60,
          },
          {
            type: 'notification',
            time: 30,
          },
          {
            type: 'both',
            time: 15,
          },
        ],
      });

      expect(event.reminders).toHaveLength(3);
      expect(event.reminders[0].type).toBe('email');
      expect(event.reminders[1].type).toBe('notification');
      expect(event.reminders[2].type).toBe('both');
    });

    it('should handle events with all-day dates', async () => {
      const allDayEvent = await Event.create({
        title: 'All-Day Event',
        creator: creatorId,
        duration: 1440, // 24 hours in minutes
        eventDates: [
          {
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-01'),
            isAllDay: true,
          },
        ],
      });

      expect(allDayEvent.eventDates[0].isAllDay).toBe(true);
      expect(allDayEvent.duration).toBe(1440);
    });

    it('should handle different visibility settings', async () => {
      const publicEvent = await Event.create({
        title: 'Public Event',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
        visibility: 'public',
      });

      const friendsEvent = await Event.create({
        title: 'Friends Event',
        creator: creatorId,
        duration: 60,
        eventDates: [
          {
            startDate: new Date(),
            endDate: new Date(),
          },
        ],
        visibility: 'friends',
      });

      expect(publicEvent.visibility).toBe('public');
      expect(friendsEvent.visibility).toBe('friends');
    });
  });
});
