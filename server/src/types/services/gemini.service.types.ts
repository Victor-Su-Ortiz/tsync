export interface IGeminiService {
  suggestMeetingTimes(eventId: string): Promise<{
    suggestedTimes: any;
    reasoningText: string;
  }>;
  scheduleWithGemini(eventId: string, organizerId: string): Promise<any>;
}
