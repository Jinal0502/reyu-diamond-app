import { Router } from "express";
import * as NotificationController from "../controllers/notification.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/", NotificationController.getNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/read/:notificationId", NotificationController.markAsRead);
router.patch("/read-all", NotificationController.markAllAsRead);

export default router;
