import Joi from "joi";

export const authValidation = {
  register: Joi.object({
    name: Joi.string().required().min(2).max(50).messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot be more than 50 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().required().email().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string()
      .required()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
        "any.required": "Password is required",
      }),
  }),

  login: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),

  googleAuth: Joi.object({
    idToken: Joi.string().required(),
    accessToken: Joi.string().required(),
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().required().email(),
  }),

  resetPassword: Joi.object({
    password: Joi.string()
      .required()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      ),
    confirmPassword: Joi.string()
      .required()
      .valid(Joi.ref("password"))
      .messages({
        "any.only": "Passwords do not match",
      }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .required()
      .min(8)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      ),
    confirmNewPassword: Joi.string()
      .required()
      .valid(Joi.ref("newPassword"))
      .messages({
        "any.only": "Passwords do not match",
      }),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
  }),
};
