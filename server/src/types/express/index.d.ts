import { Types } from "mongoose";

declare global {
  namespace Express {
    interface User {
      id: string;
      _id?: Types.ObjectId;
        role: "user" | "admin"; // or use your enum/union from User model

    }

    interface Request {
      user: User;
    }
  }
}

export {};
