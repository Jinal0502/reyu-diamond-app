import { Request, Response, NextFunction } from "express";
import * as ChatService from "../services/chat.service";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";

const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const initiateConversationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { participantId, contextType, contextId } = req.body;
    const conversation = await ChatService.initiateConversationService({
      initiatorId: (req as any).user._id,
      participantId,
      contextType,
      contextId,
    });
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.CONVERSATION_INITIATED], conversation, undefined, SuccessCode.CONVERSATION_INITIATED);
  } catch (error) {
    next(error);
  }
};

export const sendMessageController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId, text, attachments, replyToMessageId } = req.body;
    const message = await ChatService.sendMessageService({
      conversationId,
      senderId: (req as any).user._id,
      text,
      attachments,
      replyToMessageId,
    });
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.MESSAGE_SENT], message, undefined, SuccessCode.MESSAGE_SENT);
  } catch (error) {
    next(error);
  }
};

export const getConversationMessagesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await ChatService.getConversationMessagesService({
      conversationId: param(req.params.conversationId),
      userId: (req as any).user._id,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50),
    });
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.MESSAGES_FETCHED], messages, undefined, SuccessCode.MESSAGES_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getUserConversationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversations = await ChatService.getUserConversationsService({
      userId: (req as any).user._id,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
    });
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.CONVERSATIONS_FETCHED], conversations, undefined, SuccessCode.CONVERSATIONS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const markConversationAsReadController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ChatService.markConversationAsReadService({
      conversationId: param(req.params.conversationId),
      userId: (req as any).user._id,
    });
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.CONVERSATION_MARKED_READ], undefined, undefined, SuccessCode.CONVERSATION_MARKED_READ);
  } catch (error) {
    next(error);
  }
};
