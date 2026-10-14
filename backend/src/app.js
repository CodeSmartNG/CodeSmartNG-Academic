import subjectRoutes from "./routes/subject.routes.js";
import classRoutes from "./routes/class.routes.js";

app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
