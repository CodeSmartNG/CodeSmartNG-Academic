import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525, // 👈 Changed from 587 to 2525
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds timeout to fail faster
  });

  const mailOptions = {
    from: `"CodeSmartNG Academic" <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
