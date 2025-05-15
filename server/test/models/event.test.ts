import { Document } from 'mongoose';
import { describe, it, afterEach, expect, beforeEach } from '@jest/globals';

// Import your Event model and interfaces
// Note: Adjust the import path based on your project structure
import Event from '../../src/models/event.model';
import User from '../../src/models/user.model';
import { IEvent, IEventMethods, IAttendee } from '../../src/types/event.types';
import { IUser, IUserMethods } from '../../src/types/user.types';

describe('Event Model Tests', () => {
  let testCreator: Document<unknown, any, IUser> & IUser & IUserMethods;
  let testAttendee1: Document<unknown, any, IUser> & IUser & IUserMethods;
  let testAttendee2: Document<unknown, any, IUser> & IUser & IUserMethods;

  // Clear the database between tests
  beforeEach(async () => {
    // Create test users that will be used across tests
    testCreator = await User.create({
      name: 'Event Creator',
      email: 'creator@example.com',
      password: 'Password123!',
      role: 'user',
      isEmailVerified: true,
    });

    testAttendee1 = await User.create({
      name: 'Attendee One',
      email: 'attendee1@example.com',
      password: 'Password123!',
      role: 'user',
      isEmailVerified: true,
    });

    testAttendee2 = await User.create({
      name: 'Attendee Two',
      email: 'attendee2@example.com',
      password: 'Password123!',
      role: 'user',
      isEmailVerified: true,
    });
  });

  afterEach(async () => {
    await Event.deleteMany({});
    await User.deleteMany({});
  });

  // Test event creation
  it('should create a new event successfully', async () => {
    const eventData = {
      title: 'Test Event',
      description: 'This is a test event',
      creator: testCreator._id,
      duration: 60, // 60 minutes
      eventDates: [
        {
          startDate: new Date('2025-06-01T10:00:00Z'),
          endDate: new Date('2025-06-01T11:00:00Z'),
          isAllDay: false,
        },
      ],
      timezone: 'America/New_York',
      location: {
        address: '123 Main St',
        name: 'Conference Room A',
        virtual: false,
      },
      status: 'scheduled',
      visibility: 'private',
      sync: false,
    };

    const event = await Event.create(eventData);

    expect(event).toBeDefined();
    expect(event.title).toBe(eventData.title);
    expect(event.description).toBe(eventData.description);
    expect(event.creator.toString()).toBe(testCreator._id.toString());
    expect(event.duration).toBe(60);
    expect(event.eventDates).toHaveLength(1);
    expect(event.eventDates[0].isAllDay).toBe(false);
    expect(event.timezone).toBe(eventData.timezone);
    expect(event.location?.address).toBe(eventData.location.address);
    expect(event.status).toBe('scheduled');
    expect(event.visibility).toBe('private');
    expect(event.sync).toBe(false);
    expect(event.attendees).toEqual([]);
    expect(event.reminders).toEqual([]);
    expect(event.createdAt).toBeDefined();
    expect(event.updatedAt).toBeDefined();
  });

  // Test event creation with minimal required fields
  it('should create event with minimal required fields', async () => {
    const minimalEventData = {
      title: 'Minimal Event',
      creator: testCreator._id,
      duration: 30,
      eventDates: [
        {
          startDate: new Date('2025-06-01T10:00:00Z'),
          endDate: new Date('2025-06-01T10:30:00Z'),
        },
      ],
    };

    const event = await Event.create(minimalEventData);

    expect(event).toBeDefined();
    expect(event.title).toBe(minimalEventData.title);
    expect(event.creator.toString()).toBe(testCreator._id.toString());
    expect(event.duration).toBe(30);
    expect(event.eventDates).toHaveLength(1);
    expect(event.timezone).toBe('UTC'); // Default value
    expect(event.status).toBe('scheduled'); // Default value
    expect(event.visibility).toBe('private'); // Default value
    expect(event.sync).toBe(false); // Default value
  });

  // Test event validation errors
  it('should fail to create event without required fields', async () => {
    const invalidEventData = {
      description: 'Event without title',
      timezone: 'America/New_York',
    };

    await expect(Event.create(invalidEventData)).rejects.toThrow();
  });

  // Test event with multiple dates (non-consecutive)
  it('should create event with multiple non-consecutive dates', async () => {
    const multiDateEventData = {
      title: 'Multi-Date Event',
      creator: testCreator._id,
      duration: 120,
      eventDates: [
        {
          startDate: new Date('2025-06-01T10:00:00Z'),
          endDate: new Date('2025-06-01T12:00:00Z'),
          isAllDay: false,
        },
        {
          startDate: new Date('2025-06-05T10:00:00Z'),
          endDate: new Date('2025-06-05T12:00:00Z'),
          isAllDay: false,
        },
        {
          startDate: new Date('2025-06-10T10:00:00Z'),
          endDate: new Date('2025-06-10T12:00:00Z'),
          isAllDay: false,
        },
      ],
    };

    const event = await Event.create(multiDateEventData);

    expect(event.eventDates).toHaveLength(3);
    expect(event.eventDates[0].startDate).toEqual(new Date('2025-06-01T10:00:00Z'));
    expect(event.eventDates[1].startDate).toEqual(new Date('2025-06-05T10:00:00Z'));
    expect(event.eventDates[2].startDate).toEqual(new Date('2025-06-10T10:00:00Z'));
  });

  // Test all-day event
  it('should create an all-day event', async () => {
    const allDayEventData = {
      title: 'All Day Conference',
      creator: testCreator._id,
      duration: 480, // 8 hours
      eventDates: [
        {
          startDate: new Date('2025-06-01T00:00:00Z'),
          endDate: new Date('2025-06-01T23:59:59Z'),
          isAllDay: true,
        },
      ],
    };

    const event = await Event.create(allDayEventData);

    expect(event.eventDates[0].isAllDay).toBe(true);
  });

  // Test virtual event
  it('should create a virtual event with meeting link', async () => {
    const virtualEventData = {
      title: 'Virtual Meeting',
      creator: testCreator._id,
      duration: 60,
      eventDates: [
        {
          startDate: new Date('2025-06-01T14:00:00Z'),
          endDate: new Date('2025-06-01T15:00:00Z'),
        },
      ],
      location: {
        virtual: true,
        meetingLink: 'https://zoom.us/j/123456789',
        name: 'Zoom Meeting',
      },
    };

    const event = await Event.create(virtualEventData);

    expect(event.location?.virtual).toBe(true);
    expect(event.location?.meetingLink).toBe('https://zoom.us/j/123456789');
    expect(event.location?.name).toBe('Zoom Meeting');
  });

  // Test recurring event
  it('should create a recurring event', async () => {
    const recurringEventData = {
      title: 'Weekly Team Meeting',
      creator: testCreator._id,
      duration: 60,
      eventDates: [
        {
          startDate: new Date('2025-06-01T10:00:00Z'),
          endDate: new Date('2025-06-01T11:00:00Z'),
        },
      ],
      recurrence: {
        pattern: 'weekly',
        interval: 1,
        byDaysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        endDate: new Date('2025-08-31'),
      },
    };

    const event = await Event.create(recurringEventData);

    expect(event.recurrence?.pattern).toBe('weekly');
    expect(event.recurrence?.interval).toBe(1);
    expect(event.recurrence?.byDaysOfWeek).toEqual([1, 3, 5]);
    expect(event.recurrence?.endDate).toEqual(new Date('2025-08-31'));
  });

  // Test event with reminders
  it('should create event with reminders', async () => {
    const eventWithRemindersData = {
      title: 'Important Meeting',
      creator: testCreator._id,
      duration: 90,
      eventDates: [
        {
          startDate: new Date('2025-06-01T15:00:00Z'),
          endDate: new Date('2025-06-01T16:30:00Z'),
        },
      ],
      reminders: [
        {
          type: 'email',
          time: 30, // 30 minutes before
        },
        {
          type: 'notification',
          time: 15, // 15 minutes before
        },
        {
          type: 'both',
          time: 5, // 5 minutes before
        },
      ],
    };

    const event = await Event.create(eventWithRemindersData);

    expect(event.reminders).toHaveLength(3);
    expect(event.reminders[0].type).toBe('email');
    expect(event.reminders[0].time).toBe(30);
    expect(event.reminders[1].type).toBe('notification');
    expect(event.reminders[1].time).toBe(15);
    expect(event.reminders[2].type).toBe('both');
    expect(event.reminders[2].time).toBe(5);
  });

  // Test getPublicEventData method
  it('should return public event data without sensitive information', async () => {
    const eventData = {
      title: 'Public Event Test',
      creator: testCreator._id,
      duration: 60,
      eventDates: [
        {
          startDate: new Date('2025-06-01T10:00:00Z'),
          endDate: new Date('2025-06-01T11:00:00Z'),
        },
      ],
      googleCalendarEventId: 'google-event-123',
      googleCalendarId: 'calendar-123',
      visibility: 'public',
    };

    const event = await Event.create(eventData);
    const publicData = event.getPublicEventData();

    // Public data should include most fields
    expect(publicData.title).toBe(eventData.title);
    expect(publicData.duration).toBe(eventData.duration);
    expect(publicData.visibility).toBe('public');

    // Public data should NOT include Google Calendar IDs
    expect('googleCalendarEventId' in publicData).toBe(false);
    expect('googleCalendarId' in publicData).toBe(false);
  });

  // Attendee management tests
  describe('Attendee Management', () => {
    let event: Document<unknown, any, IEvent> & IEvent & IEventMethods;

    beforeEach(async () => {
      event = await Event.create({
        title: 'Team Meeting',
        creator: testCreator._id,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2025-06-01T10:00:00Z'),
            endDate: new Date('2025-06-01T11:00:00Z'),
          },
        ],
      });
    });

    it('should add attendee successfully', async () => {
      await event.addAttendee(
        testAttendee1._id.toString(),
        testAttendee1.email,
        testAttendee1.name
      );

      expect(event.attendees).toHaveLength(1);
      expect(event.attendees[0].userId.toString()).toBe(testAttendee1._id.toString());
      expect(event.attendees[0].email).toBe(testAttendee1.email);
      expect(event.attendees[0].name).toBe(testAttendee1.name);
      expect(event.attendees[0].status).toBe('pending');
    });

    it('should not add duplicate attendee', async () => {
      // Add attendee first time
      await event.addAttendee(
        testAttendee1._id.toString(),
        testAttendee1.email,
        testAttendee1.name
      );

      // Try to add same attendee again
      await event.addAttendee(
        testAttendee1._id.toString(),
        testAttendee1.email,
        testAttendee1.name
      );

      // Should still have only one attendee
      expect(event.attendees).toHaveLength(1);
    });

    it('should not add attendee with same email but different userId', async () => {
      // Add attendee with email
      await event.addAttendee(
        testAttendee1._id.toString(),
        'shared-email@example.com',
        'First User'
      );

      // Try to add different user with same email
      await event.addAttendee(
        testAttendee2._id.toString(),
        'shared-email@example.com',
        'Second User'
      );

      // Should still have only one attendee
      expect(event.attendees).toHaveLength(1);
    });

    it('should remove attendee successfully', async () => {
      // Add two attendees
      await event.addAttendee(
        testAttendee1._id.toString(),
        testAttendee1.email,
        testAttendee1.name
      );
      await event.addAttendee(
        testAttendee2._id.toString(),
        testAttendee2.email,
        testAttendee2.name
      );

      expect(event.attendees).toHaveLength(2);

      // Remove first attendee
      await event.removeAttendee(testAttendee1._id.toString());

      expect(event.attendees).toHaveLength(1);
      expect(event.attendees[0].userId.toString()).toBe(testAttendee2._id.toString());
    });

    it('should update attendee status', async () => {
      // Add attendee
      await event.addAttendee(
        testAttendee1._id.toString(),
        testAttendee1.email,
        testAttendee1.name
      );

      // Initial status should be pending
      expect(event.attendees[0].status).toBe('pending');

      // Accept the invitation
      await event.updateAttendeeStatus(testAttendee1._id.toString(), 'accepted');

      expect(event.attendees[0].status).toBe('accepted');
      expect(event.attendees[0].responseTime).toBeDefined();
    });

    it('should handle various attendee statuses', async () => {
      // Add attendee
      await event.addAttendee(
        testAttendee1._id.toString(),
        testAttendee1.email,
        testAttendee1.name
      );

      // Test different status updates
      const statuses: IAttendee['status'][] = ['accepted', 'declined', 'tentative'];

      for (const status of statuses) {
        await event.updateAttendeeStatus(testAttendee1._id.toString(), status);
        expect(event.attendees[0].status).toBe(status);
      }
    });

    it('should not update status for non-existent attendee', async () => {
      const initialAttendeeCount = event.attendees.length;

      // Try to update status for non-existent user
      await event.updateAttendeeStatus('non-existent-user-id', 'accepted');

      // No changes should occur
      expect(event.attendees).toHaveLength(initialAttendeeCount);
    });
  });

  // Static method tests
  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create events by the creator
      await Event.create({
        title: 'Creator Event 1',
        creator: testCreator._id,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2025-06-01T10:00:00Z'),
            endDate: new Date('2025-06-01T11:00:00Z'),
          },
        ],
      });

      await Event.create({
        title: 'Creator Event 2',
        creator: testCreator._id,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2025-06-05T10:00:00Z'),
            endDate: new Date('2025-06-05T11:00:00Z'),
          },
        ],
      });

      // Create event where user is an attendee
      await Event.create({
        title: 'Attendee Event',
        creator: testAttendee2._id,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2025-06-03T10:00:00Z'),
            endDate: new Date('2025-06-03T11:00:00Z'),
          },
        ],
        attendees: [
          {
            userId: testCreator._id,
            email: testCreator.email,
            name: testCreator.name,
            status: 'accepted',
          },
        ],
      });
    });

    it('should find events for a user (creator and attendee)', async () => {
      const userEvents = await Event.findEventsForUser(testCreator._id.toString());

      expect(userEvents).toHaveLength(3);

      // Verify all events are included
      const eventTitles = userEvents.map(e => e.title);
      expect(eventTitles).toContain('Creator Event 1');
      expect(eventTitles).toContain('Creator Event 2');
      expect(eventTitles).toContain('Attendee Event');
    });

    it('should find events by date range', async () => {
      const startDate = new Date('2025-06-01T00:00:00Z');
      const endDate = new Date('2025-06-04T23:59:59Z');

      const eventsInRange = await Event.findEventsByDateRange(startDate, endDate);

      expect(eventsInRange).toHaveLength(2);

      // Verify correct events are included
      const eventTitles = eventsInRange.map(e => e.title);
      expect(eventTitles).toContain('Creator Event 1');
      expect(eventTitles).toContain('Attendee Event');
      expect(eventTitles).not.toContain('Creator Event 2');
    });

    it('should return empty array for date range with no events', async () => {
      const startDate = new Date('2025-07-01T00:00:00Z');
      const endDate = new Date('2025-07-31T23:59:59Z');

      const eventsInRange = await Event.findEventsByDateRange(startDate, endDate);

      expect(eventsInRange).toHaveLength(0);
    });

    it('should handle edge cases for date ranges', async () => {
      // Exact match on start date
      const exactStartDate = new Date('2025-06-01T10:00:00Z');
      const exactEndDate = new Date('2025-06-01T10:00:00Z');

      const exactMatch = await Event.findEventsByDateRange(exactStartDate, exactEndDate);

      expect(exactMatch).toHaveLength(1);
      expect(exactMatch[0].title).toBe('Creator Event 1');
    });
  });

  // Test event visibility
  it('should create events with different visibility settings', async () => {
    const visibilityOptions: Array<'public' | 'private' | 'friends'> = [
      'public',
      'private',
      'friends',
    ];

    for (const visibility of visibilityOptions) {
      const event = await Event.create({
        title: `${visibility} Event`,
        creator: testCreator._id,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2025-06-01T10:00:00Z'),
            endDate: new Date('2025-06-01T11:00:00Z'),
          },
        ],
        visibility,
      });

      expect(event.visibility).toBe(visibility);
    }
  });

  // Test event statuses
  it('should create events with different statuses', async () => {
    const statusOptions: Array<'scheduled' | 'tentative' | 'confirmed' | 'cancelled'> = [
      'scheduled',
      'tentative',
      'confirmed',
      'cancelled',
    ];

    for (const status of statusOptions) {
      const event = await Event.create({
        title: `${status} Event`,
        creator: testCreator._id,
        duration: 60,
        eventDates: [
          {
            startDate: new Date('2025-06-01T10:00:00Z'),
            endDate: new Date('2025-06-01T11:00:00Z'),
          },
        ],
        status,
      });

      expect(event.status).toBe(status);
    }
  });

  // Test location with coordinates
  it('should create event with full location details', async () => {
    const eventData = {
      title: 'Location Test Event',
      creator: testCreator._id,
      duration: 120,
      eventDates: [
        {
          startDate: new Date('2025-06-01T10:00:00Z'),
          endDate: new Date('2025-06-01T12:00:00Z'),
        },
      ],
      location: {
        address: '123 Main Street, Anytown, USA',
        name: 'Conference Center',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        virtual: false,
        metadata: {
          parking: 'Available',
          accessibility: 'Wheelchair accessible',
        },
      },
    };

    const event = await Event.create(eventData);

    expect(event.location?.address).toBe(eventData.location.address);
    expect(event.location?.name).toBe(eventData.location.name);
    expect(event.location?.coordinates?.latitude).toBe(40.7128);
    expect(event.location?.coordinates?.longitude).toBe(-74.006);
    expect(event.location?.metadata?.parking).toBe('Available');
    expect(event.location?.metadata?.accessibility).toBe('Wheelchair accessible');
  });

  // Test Google Calendar integration fields
  it('should create event with Google Calendar integration', async () => {
    const eventData = {
      title: 'Google Calendar Sync Event',
      creator: testCreator._id,
      duration: 60,
      eventDates: [
        {
          startDate: new Date('2025-06-01T14:00:00Z'),
          endDate: new Date('2025-06-01T15:00:00Z'),
        },
      ],
      googleCalendarEventId: 'google-event-abc123',
      googleCalendarId: 'primary',
      sync: true,
    };

    const event = await Event.create(eventData);

    expect(event.googleCalendarEventId).toBe('google-event-abc123');
    expect(event.googleCalendarId).toBe('primary');
    expect(event.sync).toBe(true);
  });
});
