import subjectRoutes from "./routes/subject.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";

app.use("/api/attendance", attendanceRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
