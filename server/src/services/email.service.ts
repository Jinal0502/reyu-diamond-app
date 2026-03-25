import transporter from "../config/email.config";
import logger from "../utils/logger";
import { CustomError, ErrorCode, HTTP_STATUS } from "../utils";

interface SendEmailParams {
  to: string | string[]; 
  subject: string;
  htmlContent: string;
}

export const sendEmail = async ({
  to,
  subject,
  htmlContent,
}: SendEmailParams): Promise<void> => {
  try {

    const recipient = Array.isArray(to) ? to.join(",") : to;

    if (!process.env.SENDER_EMAIL) {
      throw new CustomError("SENDER_EMAIL is not defined in env", HTTP_STATUS.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_SERVER_ERROR);
    }

    await transporter.sendMail({
      from: `"Reyu Diamond" <${process.env.SENDER_EMAIL}>`,
      to: recipient, 
      subject,
      html: htmlContent,
    });

    logger.info("Email sent successfully", { to: recipient, subject });
    
  } catch (err) {
    logger.error("Sending email failed", { to, subject, error: err });
    throw err; 
  }
};
