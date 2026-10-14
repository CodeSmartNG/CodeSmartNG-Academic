// Ensures every school-scoped query is filtered by schoolId.
// Attach to all routes that touch school data.
export const enforceTenant = (req, res, next) => {
  if (req.user.role === "super_admin") return next(); // super admin sees all
  if (!req.user.schoolId)
    return res.status(403).json({ message: "No school associated" });

  // Every controller uses req.schoolId for queries
  req.schoolId = req.user.schoolId;
  next();
};
