import axios from "axios";

const sendEmail = async (options) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "CodeSmartNG Academic",
          email: process.env.EMAIL_FROM,
        },
        to: [
          {
            email: options.email,
          },
        ],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.message,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY, // 👈 We will use this new variable
          "content-type": "application/json",
        },
      }
    );
    
    console.log("✅ Email sent successfully via Brevo API:", response.data.messageId);
    return response.data;
  } catch (error) {
    console.error("❌ Brevo API Error:", error.response?.data || error.message);
    throw new Error("Failed to send email via Brevo API");
  }
};

export default sendEmail;
