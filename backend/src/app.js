import subjectRoutes from "./routes/subject.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import resultRoutes from "./routes/result.routes.js";
import feeRoutes from "./routes/fee.routes.js";
import parentRoutes from "./routes/parent.routes.js";
import homeworkRoutes from "./routes/homework.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
app.use("/api/homework", homeworkRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/fees", feeRoutes);

app.use("/api/assessments", assessmentRoutes);
app.use("/api/results", resultRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
