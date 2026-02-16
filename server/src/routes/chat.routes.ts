import { Router } from "express";
import * as ChatController from "../controllers/chat.controller";
import { isConversationParticipant } from "../middlewares/chatPermission.middleware";

const router = Router();

router.post("/initiate" , ChatController.initiateConversationController);

router.post("/send-message" , isConversationParticipant ,ChatController.sendMessageController);

router.get("/:conversationId" , isConversationParticipant ,ChatController.getConversationMessagesController);

router.get("/" , ChatController.getUserConversationsController);

router.patch("/:conversationId" , isConversationParticipant ,ChatController.markConversationAsReadController);

export default router;