import transporter from "../config/email.config";

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
      throw new Error("SENDER_EMAIL is not defined in env");
    }

    await transporter.sendMail({
      from: `"Reyu Diamond" <${process.env.SENDER_EMAIL}>`,
      to: recipient, 
      subject,
      html: htmlContent,
    });

    
  } catch (err) {
    console.error("Sending Email Failed:", err);
    throw err; 
  }
};
