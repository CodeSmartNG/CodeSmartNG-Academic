import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1. Create a transporter using your Brevo SMTP credentials
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"CodeSmartNG Academic" <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional: for a prettier HTML email
  };

  // 3. Send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
