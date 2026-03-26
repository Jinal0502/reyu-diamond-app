import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as ChatService from "../services/chat.service";

let ioInstance: Server; // ✅ GLOBAL IO

// ======================
// INIT SOCKET
// ======================
export const initSocket = (server: any) => {
  ioInstance = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  setupSocket(ioInstance); // attach listeners

  return ioInstance;
};

// ======================
// GET IO (USED IN SERVICES)
// ======================
export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
};

// ======================
// MAIN SOCKET LOGIC
// ======================
const setupSocket = (io: Server) => {
  // AUTH
  io.use((socket: any, next) => {
    try {
      const token = socket.handshake.auth?.token;

      console.log("🔐 Incoming token:", token);

      if (!token) return next(new Error("No token"));

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

      socket.user = decoded;
      next();
    } catch (err: any) {
      console.error("❌ AUTH ERROR:", err.message);
      next(new Error("Invalid token"));
    }
  });

  // CONNECTION
  io.on("connection", (socket: any) => {
    const userId = socket.user?.userId || socket.user?.id;

    console.log("🔥 SOCKET CONNECTED:", socket.id, "USER:", userId);

    socket.join(userId.toString());

    socket.on("joinconversation", (conversationId: string) => {
      console.log("📥 JOIN ROOM:", conversationId);
      socket.join(conversationId);
    });

    socket.on("sendMessage", async (data: any) => {
      console.log("📥 BACKEND RECEIVED:", data);

      const { conversationId, text, tempId } = data;

      try {
        const msg = await ChatService.sendMessageService({
          conversationId,
          senderId: userId,
          text,
        });

        socket.to(conversationId).emit("newMessage", msg);

        socket.emit("messageSent", {
          success: true,
          messageId: msg._id,
          tempId,
          status: "SENT",
        });

      } catch (err: any) {
        console.error("❌ SEND ERROR:", err.message);

        socket.emit("socketError", {
          success: false,
          message: err.message,
        });
      }
    });

    socket.on("disconnect", (reason: string) => {
      console.log("❌ DISCONNECTED:", socket.id, reason);
    });
  });

  io.engine.on("connection_error", (err: any) => {
    console.error("🚨 ENGINE ERROR:", err.message);
  });
};


export default setupSocket;