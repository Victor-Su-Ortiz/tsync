import Joi from "joi";

export const friendValidation = {

  // Validate friend request params (receiverId)
  checkFriendRequest: Joi.object({
    params: Joi.object({
      receiverId: Joi.string()
        .required()
        .messages({
          'any.required': 'Receiver ID is required'
        })
    })
  }),
  sendRequest: Joi.object({
    params: Joi.object({
      userId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid user ID format",
          "any.required": "User ID is required",
        }),
    }),
  }),

  handleRequest: Joi.object({
    params: Joi.object({
      requestId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid request ID format",
          "any.required": "Request ID is required",
        }),
    }),
  }),

  removeFriend: Joi.object({
    params: Joi.object({
      friendId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid friend ID format",
          "any.required": "Friend ID is required",
        }),
    }),
  }),

  blockUser: Joi.object({
    params: Joi.object({
      userId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid user ID format",
          "any.required": "User ID is required",
        }),
    }),
  }),

  updateFriendSettings: Joi.object({
    friendId: Joi.string()
      .required()
      .regex(/^[0-9a-fA-F]{24}$/),
    settings: Joi.object({
      notifications: Joi.boolean(),
      visibility: Joi.string().valid("public", "friends", "private"),
    }).min(1),
  }),
};