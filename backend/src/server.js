import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.routes.js";
import schoolRoutes from "./routes/school.routes.js";
import studentRoutes from "./routes/student.routes.js";
import classRoutes from "./routes/class.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import userRoutes from "./routes/user.routes.js"; 

// 👇 THESE ARE COMMENTED OUT BECAUSE THE FILES MIGHT BE MISSING
import attendanceRoutes from "./routes/attendance.routes.js";
import resultRoutes from "./routes/result.routes.js";
// import paymentRoutes from "./routes/payment.routes.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/users", userRoutes); 
// 👇 THESE ARE COMMENTED OUT
app.use("/api/attendance", attendanceRoutes);
app.use("/api/results", resultRoutes);
// app.use("/api/payments", paymentRoutes);

app.get("/", (_, res) =>
  res.json({
    success: true,
    message: "CodeSmartNG Academic API",
    version: "1.0.0",
  })
);

// Connect to MongoDB + start server
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Try to seed super admin
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
