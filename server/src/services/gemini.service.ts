// src/services/gemini.service.ts
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { CalendarService } from './google-calendar.service';
import Event from '../models/event.model';
import { IEvent } from '../types/event.types';
import { NotFoundError, ValidationError } from '../utils/errors';

export class GeminiService {
  private static generativeAI: GoogleGenerativeAI;
  private static geminiModel: GenerativeModel;

  /**
   * Initialize the Gemini AI client
   */
  private static initializeGeminiClient() {
    if (!this.generativeAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined in environment variables');
      }

      this.generativeAI = new GoogleGenerativeAI(apiKey);
      this.geminiModel = this.generativeAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    return this.geminiModel;
  }

  /**
   * Format free/busy data for Gemini prompt
   */
  private static formatCalendarData(freeBusyData: any[], participants: any[]) {
    const formattedData: any[] = [];

    freeBusyData.forEach((data, index) => {
      const participant = participants[index];
      const busySlots: { start: string; end: string }[] = [];

      // Extract busy slots from the free/busy response
      if (data.calendars && data.calendars.primary && data.calendars.primary.busy) {
        data.calendars.primary.busy.forEach((slot: any) => {
          busySlots.push({
            start: new Date(slot.start).toISOString(),
            end: new Date(slot.end).toISOString(),
          });
        });
      }

      formattedData.push({
        participantId: participant._id.toString(),
        name: participant.name,
        busySlots,
      });
    });

    return formattedData;
  }

  /**
   * Suggest meeting times using Gemini AI
   */
  public static async suggestMeetingTimes(eventId: string) {
    try {
      // Initialize Gemini client
      const geminiModel = this.initializeGeminiClient();

      // Get event details
      const event = await Event.findById(eventId)
        .populate('attendees', 'name email _id')
        .populate('creator', 'name email _id');

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Get free/busy information for all participants
      const freeBusyPromises = event.attendees.flatMap(participant =>
        event.eventDates.map(async eventDate => {
          if (eventDate && eventDate.startTime && eventDate.endTime) {
            return await CalendarService.getUserFreeBusy(
              participant.userId.toString(),
              eventDate.startTime,
              eventDate.endTime
            );
          } else {
            throw new Error('Invalid event date');
          }
        })
      );

      const freeBusyResults = await Promise.all(freeBusyPromises);
      console.log('Free/Busy results:', freeBusyResults);

      // Format the calendar data for the Gemini prompt
      const formattedCalendarData = this.formatCalendarData(freeBusyResults, event.attendees);

      // Create prompt for Gemini
      const prompt = this.createSchedulingPrompt(event, formattedCalendarData);

      // Call Gemini AI
      const result = await geminiModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse Gemini's response to extract suggested meeting times
      const suggestion = this.parseSuggestedTimes(text, event);

      return {
        success: true,
        suggestedTimes: suggestion.suggestedTimes,
        reasoningText: suggestion.reasoning,
      };
    } catch (error) {
      console.error('Error suggesting meeting times with Gemini:', error);
      throw error;
    }
  }

  /**
   * Create a prompt for Gemini to suggest meeting times
   */
  private static createSchedulingPrompt(event: IEvent, calendarData: any[]): string {
    // Format preferred time ranges
    const preferredTimeRanges =
      event.eventDates?.map(range => `${range.startTime} to ${range.endTime}`).join(', ') ||
      '9:00 to 17:00';

    // Format preferred days
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    // Parse preferred days from the event dates
    const preferredDays =
      event.eventDates
        ?.map(dateRange => {
          // Convert startDate string to Date object if it's not already
          const startDate = new Date(dateRange.startDate);

          // Get the day of week as an integer (0-6, where 0 is Sunday)
          const dayIndex = startDate.getDay();

          // Return the day name from our array
          return daysOfWeek[dayIndex];
        })
        .join(', ') || 'Monday, Tuesday, Wednesday, Thursday, Friday';

    // Create the prompt
    return `
You are an AI assistant specializing in optimal meeting scheduling. Please help me find the best meeting times for the following event:

EVENT DETAILS:
- Title: ${event.title}
- Description: ${event.description || 'N/A'}
- Duration: ${event.duration} minutes
- Date Range: ${this.formatDateRanges(event)}
- Preferred Time Ranges: ${preferredTimeRanges}
- Preferred Days: ${preferredDays}
- Number of Participants: ${calendarData.length}

PARTICIPANT CALENDAR DATA:
${JSON.stringify(calendarData, null, 2)}

INSTRUCTIONS:
1. Analyze the calendar data to find time slots when all participants are available.
2. Consider the preferred time ranges and preferred days when making suggestions.
3. Suggest up to 5 optimal meeting times that work for all participants.
4. For each suggestion, provide:
   - Start time (ISO format)
   - End time (ISO format)
   - Brief explanation of why this time is optimal

5. Format your response as a JSON object with this structure:
{
  "suggestedTimes": [
    {
      "start": "ISO datetime",
      "end": "ISO datetime",
      "reason": "Brief explanation"
    },
    // more suggestions
  ],
  "reasoning": "Your overall thought process"
}

IMPORTANT CONSTRAINTS:
- Only suggest times within the date range specified.
- Only suggest times that don't conflict with any participant's busy slots.
- Prioritize times that fall within preferred time ranges and days.
- Ensure each suggested meeting has the full required duration.
- If no perfect times exist, suggest the best alternatives and explain why.
`;
  }

  /**
   * Parse Gemini's response to extract suggested meeting times
   */
  private static parseSuggestedTimes(text: string, event: IEvent) {
    try {
      // Try to extract JSON from the response
      const jsonPattern = /\{[\s\S]*\}/;
      const jsonMatch = text.match(jsonPattern);

      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }

      const jsonText = jsonMatch[0];
      const parsedData = JSON.parse(jsonText);

      // Validate suggested times
      if (!parsedData.suggestedTimes || !Array.isArray(parsedData.suggestedTimes)) {
        throw new Error('Invalid format for suggested times');
      }

      // Process each suggested time
      const validatedTimes = parsedData.suggestedTimes.map((suggestion: any) => {
        const start = new Date(suggestion.start);
        let end;

        if (suggestion.end) {
          end = new Date(suggestion.end);
        } else {
          // If end time is not provided, calculate it based on duration
          end = new Date(start.getTime() + event.duration * 60 * 1000);
        }

        return {
          start,
          end,
          reason: suggestion.reason || "Optimal time based on all participants' availability",
        };
      });

      // Return validated suggested times and reasoning
      return {
        suggestedTimes: validatedTimes,
        reasoning: parsedData.reasoning || 'Based on participant availability and preferences',
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw response:', text);

      // Fallback: simple text parsing for dates in ISO format
      const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g;
      const dates = text.match(isoDatePattern);

      if (dates && dates.length >= 2) {
        // Group dates into pairs (start and end times)
        const suggestions = [];

        for (let i = 0; i < dates.length - 1; i += 2) {
          const start = new Date(dates[i]);
          const end = new Date(dates[i + 1]);

          if (end > start) {
            suggestions.push({
              start,
              end,
              reason: 'Extracted from Gemini response',
            });
          }
        }

        if (suggestions.length > 0) {
          return {
            suggestedTimes: suggestions,
            reasoning: 'Based on text analysis of Gemini response',
          };
        }
      }

      // Last resort: Return a message that no valid times could be extracted
      return {
        suggestedTimes: [],
        reasoning: 'Could not extract valid meeting times from Gemini response',
        rawResponse: text,
      };
    }
  }

  /**
   * Schedule a meeting using Gemini's suggestions
   */
  public static async scheduleWithGemini(eventId: string, organizerId: string) {
    try {
      // Get event details
      const event = await Event.findById(eventId);

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      if (event.creator._id.toString() !== organizerId) {
        throw new ValidationError('Only the organizer can schedule this event');
      }

      // Get suggested meeting times
      const { suggestedTimes } = await this.suggestMeetingTimes(eventId);

      // If no times were suggested, return an error
      if (!suggestedTimes.length) {
        return {
          success: false,
          message: 'No suitable meeting times could be found',
          suggestedTimes: [],
        };
      }

      // Use the first suggested time to schedule the meeting
      const selectedTime = suggestedTimes[0].start;

      // Schedule the event in Google Calendar
      const scheduledEvent = await CalendarService.createEvent(
        organizerId,
        eventId,
        selectedTime,
        event.duration
      );

      return {
        success: true,
        scheduledEvent,
        selectedTime,
        allSuggestions: suggestedTimes,
      };
    } catch (error) {
      console.error('Error scheduling with Gemini:', error);
      throw error;
    }
  }
  // Format multiple date ranges
  private static formatDateRanges(event: IEvent) {
    // Check if we have eventDates array
    if (event.eventDates && event.eventDates.length > 0) {
      // Map each date range to a formatted string
      const dateRanges = event.eventDates.map(dateRange => {
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        // Format to YYYY-MM-DD
        const formattedStart = startDate.toISOString().split('T')[0];
        const formattedEnd = endDate.toISOString().split('T')[0];

        return `${formattedStart} to ${formattedEnd}`;
      });

      // Join with line breaks if multiple ranges
      return dateRanges.map(range => `- Date Range: ${range}`).join('\n');
    }

    // Return empty string if no date ranges found
    return 'No date ranges specified';
  }
}

export default GeminiService;
