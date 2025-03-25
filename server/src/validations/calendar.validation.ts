// src/validations/calendar.validation.ts
import Joi from 'joi';

export const calendarValidation = {
  // Toggle calendar sync validation
  toggleSync: Joi.object({
    enabled: Joi.boolean().required(),
  }),

  // Create calendar event validation
  createEvent: Joi.object({
    summary: Joi.string().required(),
    description: Joi.string().allow('', null),
    location: Joi.string().allow('', null),
    start: Joi.object({
      dateTime: Joi.string().required(),
      timeZone: Joi.string(),
    }).required(),
    end: Joi.object({
      dateTime: Joi.string().required(),
      timeZone: Joi.string(),
    }).required(),
    attendees: Joi.array().items(
      Joi.object({
        email: Joi.string().email().required(),
        displayName: Joi.string(),
        responseStatus: Joi.string(),
      })
    ),
    reminders: Joi.object({
      useDefault: Joi.boolean(),
      overrides: Joi.array().items(
        Joi.object({
          method: Joi.string().valid('email', 'popup'),
          minutes: Joi.number(),
        })
      ),
    }),
  }),

  // Find available slots validation
  findSlots: Joi.object({
    userIds: Joi.array().items(Joi.string()).min(1).required(),
    duration: Joi.number().required(), // in minutes
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),
};

export default calendarValidation;
