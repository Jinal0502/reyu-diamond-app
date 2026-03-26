import mongoose from "mongoose";
import Conversation from "../models/Chat.conversation.model";
import Message from "../models/Chat.message.model";
import { CustomError, HTTP_STATUS, ErrorCode } from "../utils";
import logger from "../utils/logger";
import * as NotificationEvents from "../notifications/events";
import { User } from "../models/User.model";

/**
 * Initiate Conversation (Requirement/Deal)
 */
export const initiateConversationService = async ({
  initiatorId,
  participantId,
  contextType,
  contextId,
}: {
  initiatorId: string;
  participantId: string;
  contextType: "REQUIREMENT" | "DEAL";
  contextId: string;
}) => {
  if (!participantId) throw new CustomError("participantId is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  if (!contextType) throw new CustomError("contextType is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  if (!contextId) throw new CustomError("contextId is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);

  const participantIds = [initiatorId, participantId]
    .map((id) => new mongoose.Types.ObjectId(id))
    .sort((a, b) => a.toString().localeCompare(b.toString()));

  const contextType_ref = contextType === "REQUIREMENT" ? "Requirement" : "Deal";

  // check if conversation already exists
  let conversation = await Conversation.findOne({
    participantIds: { $all: participantIds, $size: 2 },
    contextType,
    contextId: new mongoose.Types.ObjectId(contextId),
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participantIds,
      contextType,
      contextId,
      contextType_ref,
      userSettings: participantIds.map((id) => ({
        userId: id,
        unreadCount: 0,
        isMuted: false,
        isPinned: false,
        isArchived: false,
      })),
    });
  }

  return conversation;
};

/**
 * Send Message
 */
export const sendMessageService = async ({
  conversationId,
  senderId,
  text,
  attachments,
  replyToMessageId,
}: {
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: any[];
  replyToMessageId?: string;
}) => {
  if (!conversationId) throw new CustomError("conversationId is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  if (!senderId) throw new CustomError("senderId is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  if (!text) throw new CustomError("text is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);

  // 1. Create message
  const message = await Message.create({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    senderId: new mongoose.Types.ObjectId(senderId),
    text,
    attachments: attachments || [],
    replyToMessageId: replyToMessageId
      ? new mongoose.Types.ObjectId(replyToMessageId)
      : undefined,
    status: "SENT",
    sentAt: new Date(),
  });

  // 2. Atomic update of conversation
  // Update last message info and increment unread count for other participants
  const updateResult = await Conversation.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(conversationId),
      participantIds: new mongoose.Types.ObjectId(senderId), // ensure sender is participant
    },
    {
      $set: {
        lastMessageText: text.substring(0, 100),
        lastMessageAt: message.sentAt,
      },
      $inc: {
        "userSettings.$[elem].unreadCount": 1
      }
    },
    {
      new: true,
      arrayFilters: [{ "elem.userId": { $ne: new mongoose.Types.ObjectId(senderId) } }]
    }
  );

  if (!updateResult) {
    throw new CustomError("Conversation not found or user not allowed", HTTP_STATUS.FORBIDDEN, ErrorCode.NOT_CONVERSATION_PARTICIPANT);
  }

  // 🔥 Notifications
  const sender = await User.findById(senderId).select("name").lean();
  const senderName = sender?.name || "Someone";

  const recipientId = updateResult.participantIds.find(id => id.toString() !== senderId.toString());

  if (recipientId) {
    NotificationEvents.notifyChatMessage(
      recipientId.toString(),
      senderName,
      text,
      conversationId
    );
  }

  return message;
};

/**
 * Get Messages (Pagination)
 */
export const getConversationMessagesService = async ({
  conversationId,
  userId,
  page = 1,
  limit = 50,
}: {
  conversationId: string;
  userId: string;
  page?: number;
  limit?: number;
}) => {
  // Verify participation using lean check
  const isParticipant = await Conversation.exists({
    _id: new mongoose.Types.ObjectId(conversationId),
    participantIds: new mongoose.Types.ObjectId(userId)
  }).lean();

  if (!isParticipant) {
    throw new CustomError("Not allowed to view this conversation or conversation not found", HTTP_STATUS.FORBIDDEN, ErrorCode.NOT_CONVERSATION_PARTICIPANT);
  }

  const skip = (page - 1) * limit;

  const messages = await Message.find({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    deletedAt: null,
  })
    .sort({ sentAt: -1 }) // Get latest messages first for better chat UI performance
    .skip(skip)
    .limit(limit)
    .populate("senderId", "firstName lastName email")
    .lean();

  return messages;
};

/**
 * Get User Conversations List (Pagination)
 */
export const getUserConversationsService = async ({
  userId,
  page = 1,
  limit = 20
}: {
  userId: string;
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;
  const conversations = await Conversation.find({
    participantIds: new mongoose.Types.ObjectId(userId),
  })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("participantIds", "firstName lastName email")
    .lean();

  return conversations;
};

/**
 * Mark Conversation as Read
 */
export const markConversationAsReadService = async ({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) => {
  if (!conversationId) throw new CustomError("conversationId is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);

  // 1. Atomic update of conversation: reset unreadCount and update lastReadAt
  const updateResult = await Conversation.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(conversationId),
      participantIds: new mongoose.Types.ObjectId(userId)
    },
    {
      $set: {
        "userSettings.$[elem].unreadCount": 0,
        "userSettings.$[elem].lastReadAt": new Date()
      }
    },
    {
      arrayFilters: [{ "elem.userId": new mongoose.Types.ObjectId(userId) }],
      new: true
    }
  );

  if (!updateResult) {
    throw new CustomError("Conversation not found or user not allowed", HTTP_STATUS.FORBIDDEN, ErrorCode.NOT_CONVERSATION_PARTICIPANT);
  }

  // 2. Mark messages as READ (only messages not sent by me)
  await Message.updateMany(
    {
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      $or: [
        { readAt: null },
        { readAt: { $exists: false } },
        { status: { $ne: "READ" } },
      ],
    },
    {
      $set: {
        readAt: new Date(),
        status: "READ",
        read: true,
      },
    }
  );

  return true;
};
