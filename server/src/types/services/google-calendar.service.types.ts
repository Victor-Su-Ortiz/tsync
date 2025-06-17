import { calendar_v3 } from 'googleapis';

export type FreeBusyResponse = { userId: string } & calendar_v3.Schema$FreeBusyResponse;

export interface IGoogleCalendarService {
  getUserFreeBusy(userId: string, timeMin: Date, timeMax: Date): Promise<any>;
  createEvent(
    organizerId: string,
    eventId: string,
    selectedTime: Date,
    duration: number
  ): Promise<{
    success: boolean;
    googleEventId: string | null | undefined;
    eventDetails: calendar_v3.Schema$Event;
    htmlLink: string | null | undefined;
  }>;
  connectGoogleCalendar(
    userId: string,
    refreshToken: string
  ): Promise<{ success: boolean; message: string }>;
}
