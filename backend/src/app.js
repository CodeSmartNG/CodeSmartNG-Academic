import subjectRoutes from "./routes/subject.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import resultRoutes from "./routes/result.routes.js";
import feeRoutes from "./routes/fee.routes.js";
app.use("/api/fees", feeRoutes);

app.use("/api/assessments", assessmentRoutes);
app.use("/api/results", resultRoutes);

app.use("/api/attendance", attendanceRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
