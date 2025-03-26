// src/services/calendar.service.ts
import { google, calendar_v3 } from 'googleapis';
import User from '../models/user.model';
import { NotFoundError, AuthenticationError, ValidationError } from '../utils/errors';
import Event from '../models/event.model';

export class CalendarService {
  /**
   * Create OAuth2 client for Google API
   */
  private static createOAuth2Client(refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    return oauth2Client;
  }

  /**
   * Get calendar client for a user
   */
  private static async getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
    const user = await User.findById(userId).select('+googleRefreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.googleRefreshToken) {
      throw new AuthenticationError('User has not connected Google Calendar');
    }

    const oauth2Client = this.createOAuth2Client(user.googleRefreshToken);
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Get user's free/busy information
   */
  public static async getUserFreeBusy(userId: string, timeMin: Date, timeMax: Date) {
    const calendar = await this.getCalendarClient(userId);

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: 'primary' }],
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new AuthenticationError('Google Calendar authorization expired');
      }
      throw error;
    }
  }

  /**
   * Find optimal meeting time based on all participants' availability
   */
  // public static async findOptimalMeetingTime(
  //   participantIds: string[],
  //   duration: number, // in minutes
  //   startDate: Date,
  //   endDate: Date,
  //   preferences: {
  //     timeRanges?: { start: string; end: string }[];
  //     preferredDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  //   } = {}
  // // ) {
  //   // Validate inputs
  //   if (duration <= 0) {
  //     throw new ValidationError('Duration must be greater than 0 minutes');
  //   }

  //   if (startDate >= endDate) {
  //     throw new ValidationError('Start date must be before end date');
  //   }

  //   if (participantIds.length === 0) {
  //     throw new ValidationError('At least one participant is required');
  //   }

  //   // Get free/busy information for all participants
  //   const freeBusyPromises = participantIds.map(userId =>
  //     this.getUserFreeBusy(userId, startDate, endDate)
  //   );

  //   try {
  //     const freeBusyResults = await Promise.all(freeBusyPromises);

  //     // Combine all busy times
  //     const allBusySlots: { start: Date; end: Date }[] = [];

  //     freeBusyResults.forEach(result => {
  //       const calendars = result.calendars || {};
  //       Object.values(calendars).forEach(calendar => {
  //         const busySlots = calendar.busy || [];
  //         busySlots.forEach(slot => {
  //           allBusySlots.push({
  //             start: new Date(slot.start),
  //             end: new Date(slot.end),
  //           });
  //         });
  //       });
  //     });

  //     // Sort busy slots by start time
  //     allBusySlots.sort((a, b) => a.start.getTime() - b.start.getTime());

  //     // Merge overlapping busy slots
  //     const mergedBusySlots: { start: Date; end: Date }[] = [];

  //     for (const slot of allBusySlots) {
  //       if (mergedBusySlots.length === 0) {
  //         mergedBusySlots.push(slot);
  //         continue;
  //       }

  //       const lastSlot = mergedBusySlots[mergedBusySlots.length - 1];

  //       if (slot.start <= lastSlot.end) {
  //         // Slots overlap, merge them
  //         lastSlot.end = new Date(Math.max(lastSlot.end.getTime(), slot.end.getTime()));
  //       } else {
  //         // No overlap, add as new slot
  //         mergedBusySlots.push(slot);
  //       }
  //     }

  //     // Find available slots
  //     const availableSlots: { start: Date; end: Date }[] = [];
  //     let currentTime = new Date(startDate);

  //     // Apply time range filters based on preferences
  //     const timeRanges = preferences.timeRanges || [{ start: '09:00', end: '17:00' }];
  //     const preferredDays = preferences.preferredDays || [1, 2, 3, 4, 5]; // Mon-Fri by default

  //     for (let i = 0; i <= mergedBusySlots.length; i++) {
  //       const nextBusyStart = i < mergedBusySlots.length ? mergedBusySlots[i].start : endDate;

  //       // If there's available time before the next busy slot
  //       if (currentTime < nextBusyStart) {
  //         // Iterate through days in this available period
  //         const tempDate = new Date(currentTime);

  //         while (tempDate < nextBusyStart) {
  //           const dayOfWeek = tempDate.getDay();

  //           // Check if this is a preferred day
  //           if (preferredDays.includes(dayOfWeek)) {
  //             // Process each preferred time range for this day
  //             for (const range of timeRanges) {
  //               // Parse time range
  //               const [startHour, startMinute] = range.start.split(':').map(Number);
  //               const [endHour, endMinute] = range.end.split(':').map(Number);

  //               // Set time range for this day
  //               const rangeStart = new Date(tempDate);
  //               rangeStart.setHours(startHour, startMinute, 0, 0);

  //               const rangeEnd = new Date(tempDate);
  //               rangeEnd.setHours(endHour, endMinute, 0, 0);

  //               // Adjust bounds if needed
  //               const effectiveStart = new Date(
  //                 Math.max(rangeStart.getTime(), currentTime.getTime())
  //               );
  //               const effectiveEnd = new Date(
  //                 Math.min(rangeEnd.getTime(), nextBusyStart.getTime())
  //               );

  //               // Check if this slot is large enough for the meeting
  //               const availableDuration =
  //                 (effectiveEnd.getTime() - effectiveStart.getTime()) / (60 * 1000);

  //               if (availableDuration >= duration && effectiveStart < effectiveEnd) {
  //                 availableSlots.push({
  //                   start: effectiveStart,
  //                   end: effectiveEnd,
  //                 });
  //               }
  //             }
  //           }

  //           // Move to next day
  //           tempDate.setDate(tempDate.getDate() + 1);
  //           tempDate.setHours(0, 0, 0, 0);
  //         }
  //       }

  //       if (i < mergedBusySlots.length) {
  //         currentTime = new Date(mergedBusySlots[i].end);
  //       }
  //     }

  //     // Find the earliest available slot that can accommodate the meeting
  //     for (const slot of availableSlots) {
  //       const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (60 * 1000);

  //       if (slotDuration >= duration) {
  //         const meetingEnd = new Date(slot.start.getTime() + duration * 60 * 1000);

  //         return {
  //           start: slot.start,
  //           end: meetingEnd,
  //           alternativeSlots: availableSlots.slice(0, 5).map(alt => ({
  //             start: alt.start,
  //             end: new Date(alt.start.getTime() + duration * 60 * 1000),
  //           })),
  //         };
  //       }
  //     }

  //     return {
  //       availableSlots: availableSlots.slice(0, 5),
  //       message: 'No optimal time found for all participants',
  //     };
  //   } catch (error) {
  //     console.error('Error finding optimal meeting time:', error);
  //     throw error;
  //   }
  // }

  /**
   * Create calendar event and invite participants
   */
  // public static async createEvent(
  //   organizerId: string,
  //   eventId: string,
  //   selectedTime: Date,
  //   duration: number
  // ) {
  //   const calendar = await this.getCalendarClient(organizerId);

  //   try {
  //     // Get event details from our database
  //     const event = await Event.findById(eventId)
  //       .populate('participants', 'email name')
  //       .populate('organizer', 'email name');

  //     if (!event) {
  //       throw new NotFoundError('Event not found');
  //     }

  //     if (event.creator._id.toString() !== organizerId) {
  //       throw new AuthenticationError('Only the organizer can create this calendar event');
  //     }

  //     // Create end time based on duration
  //     const endTime = new Date(selectedTime.getTime() + duration * 60 * 1000);

  //     // Create attendees list from participants
  //     const attendees = event.attendees.map(attendee => ({
  //       email: attendee.email,
  //       displayName: attendee.name,
  //       responseStatus: 'needsAction',
  //     }));

  //     // Always add organizer as an attendee
  //     if (!attendees.some(a => a.email === event.creator.email)) {
  //       attendees.push({
  //         email: event.creator.email,
  //         displayName: event.organizer.name,
  //         responseStatus: 'accepted',
  //         organizer: true,
  //       });
  //     }

  //     // Create Google Calendar event
  //     const calendarEvent = await calendar.events.insert({
  //       calendarId: 'primary',
  //       requestBody: {
  //         summary: event.title,
  //         description: event.description,
  //         start: {
  //           dateTime: selectedTime.toISOString(),
  //           timeZone: 'UTC', // You might want to use the user's timezone
  //         },
  //         end: {
  //           dateTime: endTime.toISOString(),
  //           timeZone: 'UTC', // You might want to use the user's timezone
  //         },
  //         attendees,
  //         // Send notifications to attendees
  //         sendUpdates: 'all',
  //       },
  //     });

  //     // Update our event with Google Calendar event ID
  //     event.googleCalendarEventId = calendarEvent.data.id;
  //     event.scheduledTime = selectedTime;
  //     event.endTime = endTime;
  //     event.status = 'scheduled';
  //     await event.save();

  //     return {
  //       success: true,
  //       googleEventId: calendarEvent.data.id,
  //       eventDetails: calendarEvent.data,
  //       htmlLink: calendarEvent.data.htmlLink,
  //     };
  //   } catch (error: any) {
  //     console.error('Error creating calendar event:', error);
  //     if (error.response?.status === 401) {
  //       throw new AuthenticationError('Google Calendar authorization expired');
  //     }
  //     throw error;
  //   }
  // }

  /**
   * Connect Google Calendar (save refresh token)
   */
  public static async connectGoogleCalendar(userId: string, refreshToken: string) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Save Google refresh token
      user.googleRefreshToken = refreshToken;
      user.isGoogleCalendarConnected = true;
      await user.save();

      return { success: true, message: 'Google Calendar connected successfully' };
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Disconnect Google Calendar (remove refresh token)
   */
  // public static async disconnectGoogleCalendar(userId: string) {
  //   try {
  //     const user = await User.findById(userId);

  //     if (!user) {
  //       throw new NotFoundError('User not found');
  //     }

  //     // If there's a refresh token, try to revoke it
  //     if (user.googleRefreshToken) {
  //       try {
  //         const oauth2Client = this.createOAuth2Client();
  //         oauth2Client.setCredentials({
  //           refresh_token: user.googleRefreshToken,
  //         });

  //         await oauth2Client.revokeToken(user.googleRefreshToken);
  //       } catch (revokeError) {
  //         console.error('Error revoking Google token:', revokeError);
  //         // Continue anyway to remove the token from our database
  //       }
  //     }

  //     // Clear Google Calendar connection data
  //     user.googleRefreshToken = undefined;
  //     user.isGoogleCalendarConnected = false;
  //     user.googleTokenExpiry = undefined;

  //     await user.save();

  //     return {
  //       success: true,
  //       message: 'Google Calendar disconnected successfully',
  //     };
  //   } catch (error) {
  //     console.error('Error disconnecting Google Calendar:', error);
  //     throw error;
  //   }
  // }
}

export default CalendarService;
