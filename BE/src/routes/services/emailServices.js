
import nodemailer from 'nodemailer';

export const sendOtpEmail = async (toEmail, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: `"Phonify Support" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: 'Mã OTP xác thực đặt lại mật khẩu',
      html: `
        <h2>Mã OTP của bạn</h2>
        <p>Mã OTP đặt lại mật khẩu là:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>Mã này có hiệu lực trong 3 phút.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("Message sent successfully!");

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};