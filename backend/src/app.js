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
import feeRoutes from "./routes/fee.routes.js";
import parentRoutes from "./routes/parent.routes.js";
import homeworkRoutes from "./routes/homework.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";

const app = express();

// ── Security & Middleware ───────────────────────────────────
app.use(helmet());
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Allow any Vercel domain OR the CLIENT_URL from Render
    if (origin.includes("vercel.app") || origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    
    return callback(new Error('CORS blocked: ' + origin));
  },
  credentials: true 
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// Rate limiting on auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased from 20 to 100 so you don't get blocked while testing
  message: { success: false, message: "Too many requests. Try again in 15 minutes." },
});

// ── Register Routes ─────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/users", userRoutes);           // 👈 ADDED
app.use("/api/students", studentRoutes);     // 👈 ADDED
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/announcements", announcementRoutes);

// ── Health Check ────────────────────────────────────────────
app.get("/", (_, res) =>
  res.json({ success: true, message: "CodeSmartNG Academic API", version: "1.0.0" })
);

// ── 404 & Error Handlers ────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Server error" });
});

export default app;
