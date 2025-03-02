import mongoose, { Types } from 'mongoose';
import Event from '../../src/models/event.model';
import User from '../../src/models/user.model';

// Define test user IDs
const testUser1Id = new Types.ObjectId();
const testUser2Id = new Types.ObjectId();
const testUser3Id = new Types.ObjectId();

// Mock user data
const mockUsers = [
  {
    _id: testUser1Id,
    name: 'Test User 1',
    email: 'user1@test.com',
    password: 'password123',
    role: 'user',
    isEmailVerified: true,
    friends: [],
    friendRequests: [],
    blockedUsers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: testUser2Id,
    name: 'Test User 2',
    email: 'user2@test.com',
    password: 'password123',
    role: 'user',
    isEmailVerified: true,
    friends: [],
    friendRequests: [],
    blockedUsers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: testUser3Id,
    name: 'Test User 3',
    email: 'user3@test.com',
    password: 'password123',
    role: 'user',
    isEmailVerified: true,
    friends: [],
    friendRequests: [],
    blockedUsers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Sample event data for testing
const createSampleEvent = (creatorId: Types.ObjectId) => ({
  title: 'Test Event',
  description: 'This is a test event',
  location: {
    address: '123 Test Street, Test City',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    virtual: false,
  },
  creator: creatorId,
  eventDates: [
    {
      date: new Date('2025-03-15'),
      isAllDay: false,
      startTime: new Date('2025-03-15T10:00:00'),
      endTime: new Date('2025-03-15T12:00:00'),
    },
  ],
  timezone: 'America/Los_Angeles',
  status: 'scheduled',
  attendees: [
    {
      userId: creatorId,
      email: 'user1@test.com',
      status: 'accepted',
      responseTime: new Date(),
    },
  ],
  visibility: 'private',
  reminders: [
    {
      type: 'notification',
      time: 30,
    },
  ],
  googleCalendarEventId: 'test-gc-id',
  googleCalendarId: 'test-calendar-id',
});

beforeEach(async () => {
  // Clear database before each test
  await mongoose.connection.dropDatabase();
  
  // Insert mock users
  await User.insertMany(mockUsers);
});

describe('Event Model Methods Tests', () => {
  describe('Instance Methods', () => {
    it('getPublicEventData should remove sensitive data', async () => {
      const eventData = createSampleEvent(testUser1Id);
      const event = new Event(eventData);
      await event.save();
      
      const publicData = event.getPublicEventData();
      
      expect(publicData.title).toBe(eventData.title);
      expect(publicData.description).toBe(eventData.description);
      expect(publicData.googleCalendarEventId).toBeUndefined();
      expect(publicData.googleCalendarId).toBeUndefined();
    });

    it('addAttendee should add a new attendee', async () => {
      const event = new Event(createSampleEvent(testUser1Id));
      await event.save();
      
      await event.addAttendee(testUser2Id.toString(), 'user2@test.com');
      
      expect(event.attendees.length).toBe(2);
      const newAttendee = event.attendees.find(a => a.userId.toString() === testUser2Id.toString());
      expect(newAttendee).toBeDefined();
      expect(newAttendee?.email).toBe('user2@test.com');
      expect(newAttendee?.status).toBe('pending');
    });

    it('addAttendee should not add duplicate attendee', async () => {
      const event = new Event(createSampleEvent(testUser1Id));
      await event.save();
      
      // Attempt to add the creator as an attendee again
      await event.addAttendee(testUser1Id.toString(), 'user1@test.com');
      
      expect(event.attendees.length).toBe(1);
    });

    it('updateAttendeeStatus should update status correctly', async () => {
      const event = new Event(createSampleEvent(testUser1Id));
      await event.save();
      
      // Add attendee
      await event.addAttendee(testUser2Id.toString(), 'user2@test.com');
      
      // Update status
      await event.updateAttendeeStatus(testUser2Id.toString(), 'accepted');
      
      // Check if status was updated
      const updatedAttendee = event.attendees.find(a => a.userId.toString() === testUser2Id.toString());
      expect(updatedAttendee).toBeDefined();
      expect(updatedAttendee?.status).toBe('accepted');
      expect(updatedAttendee?.responseTime).toBeDefined();
    });

    it('updateAttendeeStatus should not update non-existent attendee', async () => {
      const event = new Event(createSampleEvent(testUser1Id));
      await event.save();
      
      // Try to update non-existent attendee
      await event.updateAttendeeStatus(testUser3Id.toString(), 'accepted');
      
      // Nothing should change
      expect(event.attendees.length).toBe(1);
      expect(event.attendees[0].userId.toString()).toBe(testUser1Id.toString());
    });

    it('removeAttendee should remove an attendee', async () => {
      const event = new Event(createSampleEvent(testUser1Id));
      await event.save();
      
      // Add a second attendee
      await event.addAttendee(testUser2Id.toString(), 'user2@test.com');
      expect(event.attendees.length).toBe(2);
      
      // Remove the second attendee
      await event.removeAttendee(testUser2Id.toString());
      
      expect(event.attendees.length).toBe(1);
      expect(event.attendees[0].userId.toString()).toBe(testUser1Id.toString());
    });

    it('removeAttendee should handle non-existent attendee', async () => {
      const event = new Event(createSampleEvent(testUser1Id));
      await event.save();
      
      // Try to remove non-existent attendee
      await event.removeAttendee(testUser3Id.toString());
      
      // Nothing should change
      expect(event.attendees.length).toBe(1);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create events with different properties for testing static methods
      const event1 = new Event({
        ...createSampleEvent(testUser1Id),
        title: 'Event 1',
        eventDates: [{
          date: new Date('2025-03-15'),
          isAllDay: false,
          startTime: new Date('2025-03-15T10:00:00'),
          endTime: new Date('2025-03-15T12:00:00'),
        }]
      });
      
      const event2 = new Event({
        ...createSampleEvent(testUser2Id),
        title: 'Event 2',
        eventDates: [{
          date: new Date('2025-04-01'),
          isAllDay: false,
          startTime: new Date('2025-04-01T09:00:00'),
          endTime: new Date('2025-04-01T11:00:00'),
        }]
      });
      
      const event3 = new Event({
        ...createSampleEvent(testUser1Id),
        title: 'Event 3',
        eventDates: [{
          date: new Date('2025-02-01'),
          isAllDay: true
        }]
      });
      
      // Add cross-attendees
      event1.attendees.push({
        userId: testUser2Id,
        email: 'user2@test.com',
        status: 'pending'
      });
      
      event2.attendees.push({
        userId: testUser3Id,
        email: 'user3@test.com',
        status: 'accepted'
      });
      
      await event1.save();
      await event2.save();
      await event3.save();
    });

    it('findEventsForUser should find events where user is creator', async () => {
      const events = await Event.findEventsForUser(testUser1Id.toString());
      
      expect(events.length).toBe(2);
      
      // Check if events have correct titles
      const titles = events.map(e => e.title);
      expect(titles).toContain('Event 1');
      expect(titles).toContain('Event 3');
    });

    it('findEventsForUser should find events where user is attendee', async () => {
      const events = await Event.findEventsForUser(testUser2Id.toString());
      
      expect(events.length).toBe(2);
      
      // Check if events have correct titles
      const titles = events.map(e => e.title);
      expect(titles).toContain('Event 1'); // User2 is attendee
      expect(titles).toContain('Event 2'); // User2 is creator
    });

    it('findEventsForUser should handle users with no events', async () => {
      // Create a new user ID that isn't associated with any events
      const newUserId = new Types.ObjectId();
      
      const events = await Event.findEventsForUser(newUserId.toString());
      
      expect(events.length).toBe(0);
    });

    it('findEventsByDateRange should find events in date range', async () => {
      // Events in February 2025
      const febEvents = await Event.findEventsByDateRange(
        new Date('2025-02-01'),
        new Date('2025-02-28')
      );
      expect(febEvents.length).toBe(1);
      expect(febEvents[0].title).toBe('Event 3');
      
      // Events in March 2025
      const marchEvents = await Event.findEventsByDateRange(
        new Date('2025-03-01'),
        new Date('2025-03-31')
      );
      expect(marchEvents.length).toBe(1);
      expect(marchEvents[0].title).toBe('Event 1');
      
      // Events spanning multiple months
      const multiMonthEvents = await Event.findEventsByDateRange(
        new Date('2025-02-01'),
        new Date('2025-04-30')
      );
      expect(multiMonthEvents.length).toBe(3);
    });

    it('findEventsByDateRange should return empty array for date range with no events', async () => {
      // No events in January 2025
      const janEvents = await Event.findEventsByDateRange(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );
      expect(janEvents.length).toBe(0);
    });
  });
});