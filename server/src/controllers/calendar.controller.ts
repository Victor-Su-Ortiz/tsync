// src/controllers/calendar.controller.ts
import { Request, Response, NextFunction } from 'express';
import CalendarService from '../services/google-calendar.service';
import GoogleAuthService from '../services/google-auth.service';
// import { AuthService } from '../services/auth.service';

export class CalendarController {
  /**
   * Get Google Calendar auth URL
   */
  static async getAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const authUrl = await GoogleAuthService.generateAuthUrl(userId!.toString());
      res.status(200).json(authUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Google Calendar OAuth callback
   */
  static async handleAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;
      const userId = req.userId;
      if (!code || typeof code !== 'string') {
        res.status(400).json({ message: 'Authorization code is required' });
        return;
      }
      const result = await GoogleAuthService.handleAuthCallback(code, userId!.toString());
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List user's calendar events
   */
  // static async listEvents(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const userId = req.userId;
  //     const { timeMin, timeMax } = req.query;

  //     let parsedTimeMin: Date | undefined;
  //     let parsedTimeMax: Date | undefined;

  //     if (timeMin && typeof timeMin === 'string') {
  //       parsedTimeMin = new Date(timeMin);
  //     }

  //     if (timeMax && typeof timeMax === 'string') {
  //       parsedTimeMax = new Date(timeMax);
  //     }

  //     const events = await CalendarService.listEvents(userId, parsedTimeMin, parsedTimeMax);
  //     res.status(200).json({ events });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  /**
   * Create a calendar event
   */
  // static async createEvent(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const userId = req.userId;
  //     const eventData = req.body;

  //     const event = await CalendarService.createEvent(userId, eventData);
  //     res.status(201).json({ event });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  /**
   * Find available meeting slots between users
   */
  // static async findAvailableMeetingSlots(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { userIds, duration, startDate, endDate } = req.body;

  //     if (!Array.isArray(userIds) || !userIds.length) {
  //       return res.status(400).json({ message: 'At least one user ID is required' });
  //     }

  //     if (!duration || typeof duration !== 'number') {
  //       return res.status(400).json({ message: 'Valid duration in minutes is required' });
  //     }

  //     const parsedStartDate = startDate ? new Date(startDate) : new Date();
  //     const parsedEndDate = endDate
  //       ? new Date(endDate)
  //       : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days ahead

  //     const slots = await CalendarService.findAvailableMeetingSlots(
  //       userIds,
  //       duration,
  //       parsedStartDate,
  //       parsedEndDate
  //     );

  //     res.status(200).json({ availableSlots: slots });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  /**
   * Disconnect Google Calendar
   */
  // static async disconnectCalendar(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const userId = req.userId;
  //     const result = await CalendarService.disconnectCalendar(userId);
  //     res.status(200).json(result);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  /**
   * Toggle Google Calendar sync
   */
  // static async toggleCalendarSync(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const userId = req.userId;
  //     const { enabled } = req.body;

  //     if (typeof enabled !== 'boolean') {
  //       return res.status(400).json({ message: 'Enabled status must be a boolean' });
  //     }

  //     const result = await CalendarService.toggleCalendarSync(userId, enabled);
  //     res.status(200).json(result);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  /**
   * Get calendar connection status
   */
  static async getCalendarStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      // Find user and return calendar connection status
      const User = require('../models/user.model').default;
      const user = await User.findById(userId);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({
        isConnected: user.isGoogleCalendarConnected,
        syncEnabled: user.googleCalendarSyncEnabled,
      });
    } catch (error) {
      next(error);
    }
  }
}
