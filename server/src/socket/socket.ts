import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Conversation from "../models/Chat.conversation.model";
import Message from "../models/Chat.message.model";
import { CustomError } from "../utils";
import logger from "../utils/logger";

dotenv.config();

export const setupSocket = (io: Server) => {
  // JWT Middleware
  io.use((socket: any, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new CustomError("Unauthorized : Token Missing", 401));
      }

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

      socket.user = decoded;
      next();
    } catch (error) {
      return next(new CustomError("Unauthorized : Invalid Token", 401));
    }
  });

  io.on("connection", (socket: any) => {
    const userId = socket.user?.id || socket.user?._id;

    logger.info("Socket user connected", { userId });

    // Join personal room (for notifications)
    socket.join(userId);

    socket.on("joinconversation", async (conversationId: string) => {
      try {
        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
          throw new CustomError("Invalid conversationId", 400);
        }

        const conversation: any = await Conversation.findById(conversationId);

        if (!conversation) throw new CustomError("Conversation not found", 404);

        const isParticipant = conversation.participantIds.some((id: any) =>
          id.equals(userId)
        );

        if (!isParticipant) throw new CustomError("Not allowed to join", 403);

        socket.join(conversationId);

        logger.info("User joined conversation", { userId, conversationId });

        socket.emit("joinedConversation", {
          success: true,
          conversationId,
        });
      } catch (error: any) {
        logger.warn("Join conversation failed", { userId, conversationId, error: error.message });
        socket.emit("socketError", {
          success: false,
          message: error.message || "Join conversation failed",
        });
      }
    });

    socket.on("typing", ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit("typing", {
        userId,
        conversationId,
      });
    });

    socket.on(
      "sendMessage",
      async ({
        conversationId,
        text,
        attachments,
      }: {
        conversationId: string;
        text: string;
        attachments?: any[];
      }) => {
        try {
          if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
            throw new CustomError("Invalid conversationId", 400);
          }

          if (!text || text.trim().length === 0) {
            throw new CustomError("Message text is required", 400);
          }

          const conversation: any = await Conversation.findById(conversationId);

          if (!conversation) throw new CustomError("Conversation not found", 404);

          const isParticipant = conversation.participantIds.some((id: any) =>
            id.equals(userId)
          );

          if (!isParticipant) throw new CustomError("Not allowed", 403);

          const newMessage = await Message.create({
            conversationId,
            senderId: userId,
            text,
            attachments: attachments || [],
            status: "SENT",
            sentAt: new Date(),
            from: userId,
            read: false,
          });

          conversation.lastMessageText = text;
          conversation.lastMessageAt = new Date();

          conversation.userSettings = conversation.userSettings.map((setting: any) => {
            if (setting.userId.toString() !== userId.toString()) {
              setting.unreadCount = (setting.unreadCount || 0) + 1;
            }
            return setting;
          });

          await conversation.save();

          io.to(conversationId).emit("newMessage", newMessage);

          socket.emit("messageSent", {
            success: true,
            messageId: newMessage._id,
          });
        } catch (error: any) {
          logger.error("Socket sendMessage failed", { userId, conversationId, error: error.message });
          socket.emit("socketError", {
            success: false,
            message: error.message || "Message sending failed",
          });
        }
      }
    );

    socket.on(
      "markAsRead",
      async ({ conversationId }: { conversationId: string }) => {
        try {
          if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
            throw new CustomError("Invalid conversationId", 400);
          }

          const conversation: any = await Conversation.findById(conversationId);

          if (!conversation) throw new CustomError("Conversation not found", 404);

          const isParticipant = conversation.participantIds.some((id: any) =>
            id.equals(userId)
          );

          if (!isParticipant) throw new CustomError("Not allowed", 403);

          await Message.updateMany(
            {
              conversationId: new mongoose.Types.ObjectId(conversationId),
              senderId: { $ne: new mongoose.Types.ObjectId(userId) },
              readAt: null,
            },
            {
              $set: {
                readAt: new Date(),
                status: "READ",
                read: true,
              },
            }
          );

          conversation.userSettings = conversation.userSettings.map((setting: any) => {
            if (setting.userId.toString() === userId.toString()) {
              setting.unreadCount = 0;
              setting.lastReadAt = new Date();
            }
            return setting;
          });

          await conversation.save();

          io.to(conversationId).emit("messagesRead", {
            conversationId,
            userId,
          });

          socket.emit("readSuccess", {
            success: true,
            conversationId,
          });
        } catch (error: any) {
          logger.error("Socket markAsRead failed", { userId, conversationId, error: error.message });
          socket.emit("socketError", {
            success: false,
            message: error.message || "Mark read failed",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      logger.info("Socket user disconnected", { userId });
    });
  });
};
