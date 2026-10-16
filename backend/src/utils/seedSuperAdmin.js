import User from "../models/User.js";

export const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.warn("⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set. Skipping seed.");
      return;
    }

    const existing = await User.findOne({
      email: email.toLowerCase(),
      role: "super_admin",
    });

    if (existing) {
      console.log("ℹ️  Super Admin already exists");
      return;
    }

    await User.create({
      fullName: "CodeSmartNG Super Admin",
      email: email.toLowerCase(),
      password,
      role: "super_admin",
      isActive: true,
    });

    console.log(`✅ Super Admin seeded: ${email}`);
  } catch (err) {
    console.error("❌ Failed to seed Super Admin:", err.message);
  }
};
