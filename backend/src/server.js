import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import schoolRoutes from "./routes/school.routes.js";
// ...import student, attendance, result, payment routes

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolRoutes);
// app.use("/api/students", studentRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/results", resultRoutes);
// app.use("/api/payments", paymentRoutes);

app.get("/", (_, res) => res.json({ status: "CodeSmartNG Academic API" }));

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT || 5000, () =>
    console.log(`Server running on port ${process.env.PORT || 5000}`)
  );
});
