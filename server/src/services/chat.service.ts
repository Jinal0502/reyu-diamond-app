import mongoose from "mongoose";
import Conversation from "../models/Chat.conversation.model";
import Message from "../models/Chat.message.model";
import { CustomError } from "../utils/customError.utility";

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
  if (!participantId) throw new CustomError("participantId is required", 400);
  if (!contextType) throw new CustomError("contextType is required", 400);
  if (!contextId) throw new CustomError("contextId is required", 400);

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
  if (!conversationId) throw new CustomError("conversationId is required", 400);
  if (!senderId) throw new CustomError("senderId is required", 400);
  if (!text) throw new CustomError("text is required", 400);

  const conversation: any = await Conversation.findById(conversationId);
  if (!conversation) throw new CustomError("Conversation not found", 404);

  console.log(conversation);

  // check sender is participant
  const isParticipant = conversation.participantIds.some((id: any) =>
  id.equals(senderId)
    );

  console.log(isParticipant);

  if (!isParticipant) {
    throw new CustomError("Not allowed to send message in this chat", 403);
  }

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

  // update conversation last message
  conversation.lastMessageText = text.substring(0, 100);
  conversation.lastMessageAt = message.sentAt;

  // update unread count for other participant
  conversation.userSettings = conversation.userSettings.map((setting: any) => {
    if (setting.userId.toString() !== senderId) {
      setting.unreadCount = (setting.unreadCount || 0) + 1;
    }
    return setting;
  });

  await conversation.save();

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
  const conversation: any = await Conversation.findById(conversationId);
  if (!conversation) throw new CustomError("Conversation not found", 404);

  const isParticipant = conversation.participantIds.some((id: any) =>
  id.equals(userId)
    );

  if (!isParticipant) {
    throw new CustomError("Not allowed to view this conversation", 403);
  }

  const skip = (page - 1) * limit;

  const messages = await Message.find({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    deletedAt: null,
  })
    .sort({ sentAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate("senderId", "firstName lastName email");

  return messages;
};

/**
 * Get User Conversations List
 */
export const getUserConversationsService = async (userId: string) => {
  const conversations = await Conversation.find({
    participantIds: new mongoose.Types.ObjectId(userId),
  })
    .sort({ updatedAt: -1 })
    .populate("participantIds", "firstName lastName email");

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
  if (!conversationId) throw new CustomError("conversationId is required", 400);

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) throw new CustomError("Conversation not found", 404);

  const isParticipant = conversation.participantIds.some((id: any) =>
    id.equals(userId)
  );

  if (!isParticipant) {
    throw new CustomError("Not allowed", 403);
  }

  // mark messages as READ (only messages not sent by me)
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
        read : true,
      },
    }
  );

  // reset unreadCount for this user
  conversation.userSettings = conversation.userSettings.map((setting: any) => {
    if (setting.userId.equals(userId)) {
      setting.unreadCount = 0;
      setting.lastReadAt = new Date();
    }
    return setting;
  });

  await conversation.save();

  return true;
};

