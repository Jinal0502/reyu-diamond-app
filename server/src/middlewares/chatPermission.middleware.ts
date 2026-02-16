import {Response , NextFunction} from "express";
import Conversation  from "../models/Chat.conversation.model";
import { sendResponse } from "../utils/api.response";
import mongoose from "mongoose";

export const isConversationParticipant = async (req: any, res: Response, next: NextFunction) => {
  try {
    const conversationId = req.params.conversationId || req.body.conversationId;

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return sendResponse(res, 400, false, "Invalid Conversation");
    }

    if (!req.user?._id) {
      return sendResponse(res, 401, false, "Unauthorized");
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return sendResponse(res, 404, false, "Conversation Not found");
    }

    const isParticipant = conversation.participantIds.some((p: any) =>
      p.equals(req.user._id)
    );

    if (!isParticipant) {
      return sendResponse(res, 403, false, "Access Denied");
    }

    req.conversation = conversation;
    next();
  } catch (error) {
    console.log("Chat Permission error : ", error);
    return sendResponse(res, 500, false, "Authorization failed");
  }
};
