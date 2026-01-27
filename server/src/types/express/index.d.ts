import { Types } from "mongoose";

declare global {
  namespace Express {
    interface User {
      _id: Types.ObjectId;     // REAL ID
      role: "user" | "admin";
      email?: string;
      name?: string;
    }

    interface Request {
      user: User;
      userRole: "user" | "admin";
    }
  }
}

export {};
