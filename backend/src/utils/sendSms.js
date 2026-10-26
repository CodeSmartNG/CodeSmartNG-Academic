// backend/src/utils/sendSms.js
import axios from "axios";

const TERMII_API_URL = "https://api.ng.termii.com/api/sms/send";

/**
 * Sends a single SMS message using the Termii API.
 * @param {string} to - The recipient's phone number (e.g., '2348012345678').
 * @param {string} message - The message content.
 */
export const sendSms = async (to, message) => {
  try {
    // It's good practice to ensure the number is in international format.
    // This simple regex ensures it starts with '234' and has 10 digits after.
    const formattedPhone = to.replace(/\D/g, '');
    const internationalPhone = formattedPhone.startsWith('0') 
      ? `234${formattedPhone.substring(1)}` 
      : formattedPhone;

    const payload = {
      to: internationalPhone,
      from: process.env.TERMII_SENDER_ID,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: process.env.TERMII_API_KEY,
    };

    const response = await axios.post(TERMII_API_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log(`✅ SMS sent to ${internationalPhone}:`, response.data.message_id);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to send SMS:", error.response?.data || error.message);
    // We throw an error so the calling function knows it failed,
    // but we don't want this to crash the main application flow.
    throw new Error("Failed to send SMS notification");
  }
};
