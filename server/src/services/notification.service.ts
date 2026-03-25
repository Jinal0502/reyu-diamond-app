import Notification, { INotification } from "../models/Notification.model";
import { User } from "../models/User.model";
import { messaging } from "../config/firebase";
import admin from "firebase-admin";
import logger from "../utils/logger";
import mongoose from "mongoose";
import { getIO } from "../socket/socket";

export type NotificationType = INotification["type"];

export interface NotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  senderId?: string;
}

export class NotificationService {
  /**
   * Core method to notify a single user (DB + FCM)
   */
  static async notifyUser({
    recipientId,
    senderId,
    title,
    body,
    type,
    data = {},
  }: {
    recipientId: string;
    senderId?: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, any>;
  }) {
    try {
      // 1. Save in MongoDB (Persistent Record)
      const notification = await Notification.create({
        recipient: new mongoose.Types.ObjectId(recipientId),
        sender: senderId ? new mongoose.Types.ObjectId(senderId) : undefined,
        title,
        body,
        type,
        data,
      });

      // 🔥 Real-time Socket Emit
      const io = getIO();
      if (io) {
        io.to(recipientId.toString()).emit("new_notification", notification);
      }

      // 2. Fetch User FCM Tokens
      const user = await User.findById(recipientId).select("fcmTokens").lean();
      const tokens: string[] = user?.fcmTokens || [];

      if (tokens.length === 0) {
        return notification;
      }

      // 3. Prepare FCM Multicast
      const formattedData = Object.fromEntries(
        Object.entries({
          notificationId: notification._id.toString(),
          type,
          ...data,
        }).map(([k, v]) => [k, String(v)])
      );

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: formattedData,
      });

      // 4. Handle Token Cleanup (Atomic $pull)
      const invalidTokens: string[] = [];
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          const code = (res.error as any)?.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-argument" ||
            code === "messaging/mismatched-credential"
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        logger.info(`Cleaning up ${invalidTokens.length} invalid FCM tokens for user ${recipientId}`);
        await User.findByIdAndUpdate(recipientId, {
          $pull: { fcmTokens: { $in: invalidTokens } },
        });
      }

      return notification;
    } catch (error: any) {
      logger.error("NotificationService Error:", { error: error.message, recipientId, type });
      // We don't throw here to avoid breaking the calling business logic
      return null;
    }
  }

  /**
   * Notify multiple users (Batch processing)
   */
  static async notifyMultiple(userIds: string[], payload: NotificationPayload) {
    const notifications = await Promise.allSettled(
      userIds.map((id) =>
        this.notifyUser({
          recipientId: id,
          ...payload,
        })
      )
    );
    return notifications;
  }

  /**
   * Notify all system admins
   */
  static async notifyAdmins(payload: NotificationPayload) {
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    const adminIds = admins.map((a) => a._id.toString());
    return this.notifyMultiple(adminIds, payload);
  }
  static async notifyAll(payload: NotificationPayload) {
    const users = await User.find().select("_id").lean();
    const userIds = users.map((u) => u._id.toString());
    return this.notifyMultiple(userIds, payload);
  }
}
