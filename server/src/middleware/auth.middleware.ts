// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticationError, ForbiddenError } from "../utils/errors";
import User from "../models/user.model";
// import { IUser, IUserMethods } from "../types/user";


export const protect = async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AuthenticationError("Not authorized to access this route");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    req.userId = decoded.userId;

    next();
  } catch (error) {
    next(new AuthenticationError("Not authorized to access this route"));
  }
};

/**
 * Role-based access control middleware
 * Restricts route access to specific user roles
 * @param roles Allowed roles for the route
 */
export const restrictTo = (...roles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Check if userId exists (protect middleware should run first)
      if (!req.userId) {
        throw new AuthenticationError("Not authenticated");
      }

      // Get user from database to check role
      const user = await User.findById(req.userId);
      if (!user) {
        throw new AuthenticationError("User not found");
      }

      // Check if user role is allowed
      if (!roles.includes(user.role)) {
        throw new ForbiddenError(
          "You do not have permission to perform this action"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

