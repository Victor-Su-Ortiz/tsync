// src/controllers/gemini.controller.ts
import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service';
import Event from '../models/event.model';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import mongoose from 'mongoose';
import socketService from '../services/socket.service';

export class GeminiController {
  /**
   * Get AI-suggested meeting times for an event
   */
  static async getSuggestedTimes(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;

      // Validate eventId
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ValidationError('Invalid event ID');
      }

      // Check if user has access to the event
      const event = await Event.findById(eventId);

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Check authorization (only organizer or participants can access)
      const userId = req.userId;
      const isOrganizer = event.creator._id.toString() === userId?.toString();
      const isParticipant = event.attendees.some(p => p.userId === userId);

      if (!isOrganizer && !isParticipant) {
        throw new ForbiddenError('You do not have permission to access this event');
      }

      // Get AI suggestions
      const suggestions = await GeminiService.suggestMeetingTimes(eventId);

      res.status(200).json({
        success: true,
        ...suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule a meeting using Gemini AI (auto-scheduling)
   */
  static async scheduleWithGemini(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params;

      // Validate eventId
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ValidationError('Invalid event ID');
      }

      // Check if user is the organizer
      const event = await Event.findById(eventId);

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      const userId = req.userId;
      if (!event.creator._id.equals(userId)) {
        throw new ForbiddenError('Only the event organizer can schedule this event');
      }

      // Schedule with Gemini
      const result = await GeminiService.scheduleWithGemini(eventId, userId!.toString());
      console.log('result', result);

      // If successful, notify participants
      if (result.success) {
        // Fetch full event details with participants
        const updatedEvent = await Event.findById(eventId)
          .populate('attendees', '_id name email')
          .populate('creator', '_id name email');

        // Notify participants about the scheduled event
        updatedEvent?.attendees.forEach((participant: any) => {
          if (participant._id.toString() !== userId) {
            // Send socket notification if user is online
            if (socketService.isUserOnline(participant._id.toString())) {
              socketService.sendToUser(participant._id.toString(), 'event_scheduled', {
                eventId: event._id,
                title: event.title,
                scheduledTime: result.selectedTime,
                organizer: (updatedEvent?.creator as any).name,
                aiScheduled: true,
              });
            }
          }
        });
      }

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default GeminiController;
