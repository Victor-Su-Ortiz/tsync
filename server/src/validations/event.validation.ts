import Joi from 'joi';

export const eventValidation = {
  // Create event validation schema
  createEvent: Joi.object({
    title: Joi.string().required().min(3).max(100)
      .messages({
        'string.empty': 'Title is required',
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 100 characters',
        'any.required': 'Title is required'
      }),
    description: Joi.string().allow('').max(1000)
      .messages({
        'string.max': 'Description cannot exceed 1000 characters'
      }),
    startTime: Joi.date().iso().required()
      .messages({
        'date.base': 'Start time must be a valid date',
        'any.required': 'Start time is required'
      }),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required()
      .messages({
        'date.base': 'End time must be a valid date',
        'date.greater': 'End time must be after start time',
        'any.required': 'End time is required'
      }),
    location: Joi.string().allow('').max(100)
      .messages({
        'string.max': 'Location cannot exceed 100 characters'
      }),
    isVirtual: Joi.boolean().default(false),
    meetingLink: Joi.string().uri().allow('').max(500)
      .messages({
        'string.uri': 'Meeting link must be a valid URL',
        'string.max': 'Meeting link cannot exceed 500 characters'
      }),
    isPublic: Joi.boolean().default(false),
    attendees: Joi.array().items(
      Joi.object({
        userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        email: Joi.string().email(),
        role: Joi.string().valid('organizer', 'attendee').default('attendee'),
        status: Joi.string().valid('pending', 'accepted', 'declined').default('pending')
      }).or('userId', 'email')
    ).default([]),
    reminders: Joi.array().items(
      Joi.object({
        time: Joi.number().integer().min(0),
        type: Joi.string().valid('email', 'notification').required()
      })
    ).default([]),
    recurrence: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
      interval: Joi.number().integer().min(1).default(1),
      endDate: Joi.date().iso().min(Joi.ref('$startTime')),
      count: Joi.number().integer().min(1),
      byDay: Joi.array().items(
        Joi.string().valid('MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU')
      ),
      byMonthDay: Joi.array().items(
        Joi.number().integer().min(1).max(31)
      ),
      excludeDates: Joi.array().items(Joi.date().iso())
    }).default(null),
    color: Joi.string().pattern(/^#([0-9a-fA-F]{6})$/).allow(''),
    syncWithGoogle: Joi.boolean().default(false),
    category: Joi.string().allow('').max(50)
  }),

  // Update event validation schema
  updateEvent: Joi.object({
    title: Joi.string().min(3).max(100)
      .messages({
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 100 characters'
      }),
    description: Joi.string().allow('').max(1000)
      .messages({
        'string.max': 'Description cannot exceed 1000 characters'
      }),
    startTime: Joi.date().iso()
      .messages({
        'date.base': 'Start time must be a valid date'
      }),
    endTime: Joi.date().iso()
      .when('startTime', {
        is: Joi.exist(),
        then: Joi.date().greater(Joi.ref('startTime')).required()
          .messages({
            'date.greater': 'End time must be after start time',
            'any.required': 'End time is required when start time is provided'
          }),
        otherwise: Joi.date().iso()
      })
      .messages({
        'date.base': 'End time must be a valid date'
      }),
    location: Joi.string().allow('').max(100)
      .messages({
        'string.max': 'Location cannot exceed 100 characters'
      }),
    isVirtual: Joi.boolean(),
    meetingLink: Joi.string().uri().allow('').max(500)
      .messages({
        'string.uri': 'Meeting link must be a valid URL',
        'string.max': 'Meeting link cannot exceed 500 characters'
      }),
    isPublic: Joi.boolean(),
    reminders: Joi.array().items(
      Joi.object({
        time: Joi.number().integer().min(0),
        type: Joi.string().valid('email', 'notification').required()
      })
    ),
    recurrence: Joi.object({
      frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
      interval: Joi.number().integer().min(1).default(1),
      endDate: Joi.date().iso(),
      count: Joi.number().integer().min(1),
      byDay: Joi.array().items(
        Joi.string().valid('MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU')
      ),
      byMonthDay: Joi.array().items(
        Joi.number().integer().min(1).max(31)
      ),
      excludeDates: Joi.array().items(Joi.date().iso())
    }),
    color: Joi.string().pattern(/^#([0-9a-fA-F]{6})$/).allow(''),
    syncWithGoogle: Joi.boolean(),
    category: Joi.string().allow('').max(50)
  }),

  // Add attendee validation schema
  addAttendee: Joi.object({
    attendeeId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    email: Joi.string().email(),
    role: Joi.string().valid('organizer', 'attendee').default('attendee')
  }).or('attendeeId', 'email')
    .messages({
      'object.missing': 'Either attendeeId or email is required'
    }),

  // Update attendee status validation schema
  updateAttendeeStatus: Joi.object({
    status: Joi.string().valid('accepted', 'declined', 'pending').required()
      .messages({
        'any.only': 'Status must be one of: accepted, declined, pending',
        'any.required': 'Status is required'
      })
  })
};