import Joi from 'joi';

// Password pattern with security requirements
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// MongoDB ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const userValidation = {
  /**
   * Search users validation schema
   */
  searchUsers: Joi.object({
    query: Joi.object({
      q: Joi.string().min(2).required().messages({
        'string.min': 'Search query must be at least 2 characters long',
        'any.required': 'Search query is required',
      }),
      limit: Joi.number().integer().min(1).max(50).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50',
      }),
    }),
  }),
  /**
   * Update profile validation schema
   */
  updateProfile: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(50).optional(),
      email: Joi.string().email().optional(),
    })
      .min(1)
      .messages({
        'object.min': 'At least one field is required to update',
      }),
  }),

  /**
   * Change password validation schema
   */
  changePassword: Joi.object({
    body: Joi.object({
      currentPassword: Joi.string().min(8).max(100).required().messages({
        'string.min': 'Current password must be at least 8 characters',
        'any.required': 'Current password is required',
      }),
      newPassword: Joi.string().min(8).max(100).pattern(passwordPattern).required().messages({
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'New password must be at least 8 characters',
        'any.required': 'New password is required',
      }),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required',
      }),
    }).custom((value, helpers) => {
      if (value.currentPassword === value.newPassword) {
        return helpers.error('any.invalid', {
          message: 'New password must be different from current password',
        });
      }
      return value;
    }),
  }),

  /**
   * Admin: Create user validation schema
   */
  createUser: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required',
      }),
      email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
      }),
      password: Joi.string().min(8).max(100).pattern(passwordPattern).required().messages({
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'Password must be at least 8 characters',
        'any.required': 'Password is required',
      }),
      role: Joi.string().valid('user', 'admin').default('user'),
      profilePicture: Joi.string().uri().optional().messages({
        'string.uri': 'Profile picture must be a valid URL',
      }),
    }),
  }),

  /**
   * Admin: Update user validation schema
   */
  updateUser: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(50).optional(),
      email: Joi.string().email().optional(),
      role: Joi.string().valid('user', 'admin').optional(),
      isEmailVerified: Joi.boolean().optional(),
      profilePicture: Joi.string().uri().allow(null).optional(),
    })
      .min(1)
      .messages({
        'object.min': 'At least one field is required to update',
      }),
    params: Joi.object({
      id: Joi.string().regex(objectIdPattern).required().messages({
        'string.pattern.base': 'Invalid MongoDB ID format',
        'any.required': 'User ID is required',
      }),
    }),
  }),

  /**
   * Admin: Update user status validation schema
   */
  updateUserStatus: Joi.object({
    body: Joi.object({
      status: Joi.boolean().required().messages({
        'any.required': 'Status is required',
        'boolean.base': 'Status must be a boolean value',
      }),
    }),
    params: Joi.object({
      id: Joi.string().regex(objectIdPattern).required().messages({
        'string.pattern.base': 'Invalid MongoDB ID format',
        'any.required': 'User ID is required',
      }),
    }),
  }),
};

export default userValidation;
