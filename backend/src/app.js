import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// ── Import all routes ───────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import schoolRoutes from "./routes/school.routes.js";
import userRoutes from "./routes/user.routes.js";
import studentRoutes from "./routes/student.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import resultRoutes from "./routes/result.routes.js";
import feeRoutes from "./routes/fee.routes.js";            // 👈 MUST BE HERE
import parentRoutes from "./routes/parent.routes.js";
import homeworkRoutes from "./routes/homework.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";

const app = express();

// ── Security & Middleware ───────────────────────────────────
app.use(helmet());
app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes("vercel.app") || origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked: ' + origin));
  },
  credentials: true 
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests." },
});

// ── Register Routes ─────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/fees", feeRoutes);                           // 👈 MUST BE HERE
app.use("/api/parent", parentRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/announcements", announcementRoutes);

app.get("/", (_, res) =>
  res.json({ success: true, message: "CodeSmartNG Academic API", version: "1.0.0" })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
});

export default app;
