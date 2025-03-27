import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ValidationError } from "../utils/errors";

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, _: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return next(new ValidationError(errorMessage));
    }

    next();
  };
};
