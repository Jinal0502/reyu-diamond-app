import { Request, Response, NextFunction } from "express";
import * as ChatService from "../services/chat.service";
import { sendResponse } from "../utils/api.response";

export const initiateConversationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const initiatorId = (req as any).user._id;

    const { participantId, contextType, contextId } = req.body;

    const conversation = await ChatService.initiateConversationService({
      initiatorId,
      participantId,
      contextType,
      contextId,
    });

    return sendResponse(
      res,
      201,
      true,
      "Conversation initiated successfully",
      conversation
    );
  } catch (error) {
    next(error);
  }
};

export const sendMessageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const senderId = (req as any).user._id;

    const { conversationId, text, attachments, replyToMessageId } = req.body;

    const message = await ChatService.sendMessageService({
      conversationId,
      senderId,
      text,
      attachments,
      replyToMessageId,
    });

    return sendResponse(res, 201, true, "Message sent successfully", message);
  } catch (error) {
    next(error);
  }
};

export const getConversationMessagesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id;

    const conversationId = req.params.conversationId as string;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);

    const messages = await ChatService.getConversationMessagesService({
      conversationId,
      userId,
      page,
      limit,
    });

    return sendResponse(res, 200, true, "Messages fetched successfully", messages);
  } catch (error) {
    next(error);
  }
};

export const getUserConversationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id;

    const conversations = await ChatService.getUserConversationsService(userId);

    return sendResponse(
      res,
      200,
      true,
      "Conversations fetched successfully",
      conversations
    );
  } catch (error) {
    next(error);
  }
};

export const markConversationAsReadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id;
    const conversationId = req.params.conversationId as string;

    await ChatService.markConversationAsReadService({
      conversationId,
      userId,
    });

    return sendResponse(res, 200, true, "Conversation marked as read");
  } catch (error) {
    next(error);
  }
};
