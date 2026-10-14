import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: function () {
        return this.role !== "super_admin";
      },
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["super_admin", "proprietor", "admin", "teacher", "parent", "pupil"],
      required: true,
    },
    // For parents: array of student IDs
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    // For teachers: assigned classes & subjects
    assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

// Unique email per school (except super_admin)
userSchema.index({ schoolId: 1, email: 1 }, { unique: true, sparse: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);
