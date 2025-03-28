// src/validations/notification.validation.ts
import Joi from 'joi';

export const notificationValidation = {
  markAsRead: Joi.object({
    notificationIds: Joi.array()
      .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
      .optional(),
  }),

  deleteNotifications: Joi.object({
    notificationIds: Joi.array()
      .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
      .min(1)
      .required(),
  }),
};

export default notificationValidation;
