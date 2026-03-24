import { messaging } from "../config/firebase";
import logger from "./logger";

export const sendPushNotification = async({
    token,
    title,
    body,
    data = {},
} : {
    token : string,
    title : string,
    body : string,
    data?: Record<string, any>
}) => {
    try {
        const reponse = await messaging.send({
            token,
            notification: {
                title,
                body,
            },
            data : Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])) // convert all values to string
        });
        return reponse;
    } catch (error : any) {
        logger.error("Error sending push notification", { error });

        if(error.code === "messaging/invalid-recipient") {
            logger.warn("Invalid FCM token, consider removing it from database", { token });
        }

        throw error;
    }
}