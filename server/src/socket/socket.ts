import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Conversation from "../models/Chat.conversation.model";
import Message from "../models/Chat.message.model";
import { CustomError } from "../utils/customError.utility";

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

      socket.user = decoded; // must contain id/_id
      next();
    } catch (error) {
      return next(new CustomError("Unauthorized : Invalid Token", 401));
    }
  });

  io.on("connection", (socket: any) => {
    const userId = socket.user?.id || socket.user?._id;

    console.log("User Connected:", userId);

    // Join personal room (for notifications)
    socket.join(userId);

    /**
     * JOIN CONVERSATION ROOM
     * This must be validated otherwise anyone can join any conversationId
     */
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

        console.log(`User ${userId} joined conversation ${conversationId}`);

        socket.emit("joinedConversation", {
          success: true,
          conversationId,
        });
      } catch (error: any) {
        socket.emit("socketError", {
          success: false,
          message: error.message || "Join conversation failed",
        });
      }
    });

    /**
     * TYPING EVENT
     */
    socket.on("typing", ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationId).emit("typing", {
        userId,
        conversationId,
      });
    });

    /**
     * SEND MESSAGE
     */
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

          // Save message
          const newMessage = await Message.create({
            conversationId,
            senderId: userId,
            text,
            attachments: attachments || [],
            status: "SENT",
            sentAt: new Date(),

            // legacy support
            from: userId,
            read: false,
          });

          // Update conversation last message
          conversation.lastMessageText = text;
          conversation.lastMessageAt = new Date();

          // Update unreadCount for receiver
          conversation.userSettings = conversation.userSettings.map((setting: any) => {
            if (setting.userId.toString() !== userId.toString()) {
              setting.unreadCount = (setting.unreadCount || 0) + 1;
            }
            return setting;
          });

          await conversation.save();

          // Emit message to all users in room
          io.to(conversationId).emit("newMessage", newMessage);

          // Send ack to sender
          socket.emit("messageSent", {
            success: true,
            messageId: newMessage._id,
          });
        } catch (error: any) {
          socket.emit("socketError", {
            success: false,
            message: error.message || "Message sending failed",
          });
        }
      }
    );

    /**
     * MARK AS READ
     */
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

          // Update all messages from other person as READ
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
                read: true, // legacy
              },
            }
          );

          // Reset unreadCount for current user
          conversation.userSettings = conversation.userSettings.map((setting: any) => {
            if (setting.userId.toString() === userId.toString()) {
              setting.unreadCount = 0;
              setting.lastReadAt = new Date();
            }
            return setting;
          });

          await conversation.save();

          // Notify other user
          io.to(conversationId).emit("messagesRead", {
            conversationId,
            userId,
          });

          socket.emit("readSuccess", {
            success: true,
            conversationId,
          });
        } catch (error: any) {
          socket.emit("socketError", {
            success: false,
            message: error.message || "Mark read failed",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User Disconnected:", userId);
    });
  });
};
