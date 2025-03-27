import nodemailer from "nodemailer";

/**
 * Sends an email using Nodemailer
 */
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string; // Optional, will be generated if missing
  html: string;
}): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Ensure text version exists if not provided
    const plainText = text || html.replace(/<[^>]+>/g, "");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: plainText,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
