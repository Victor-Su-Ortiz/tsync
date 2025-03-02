// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../utils/errors";
// import User from "../models/user.model";
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
