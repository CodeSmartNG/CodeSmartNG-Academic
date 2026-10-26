import axios from "axios";

export const sendSms = async (to, message) => {
  try {
    // Format phone number (e.g., 08012345678 -> 2348012345678)
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

    const response = await axios.post("https://api.ng.termii.com/api/sms/send", payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log(`✅ SMS sent to ${internationalPhone}:`, response.data.message_id);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to send SMS:", error.response?.data || error.message);
    // We catch the error so a failed SMS doesn't crash the main app
    throw new Error("Failed to send SMS notification");
  }
};
