import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js"; // 👈 This imports the correct app with all routes

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    try {
      const { seedSuperAdmin } = await import("./utils/seedSuperAdmin.js");
      await seedSuperAdmin();
    } catch (seedErr) {
      console.warn(`⚠️  Super Admin seed skipped:`, seedErr.message);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Listening on 0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

start();
