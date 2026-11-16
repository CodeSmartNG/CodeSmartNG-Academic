import mongoose from "mongoose";

const timetableSlotSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
    required: true 
  },
  startTime: { type: String, required: true }, // e.g. "08:00"
  endTime: { type: String, required: true },   // e.g. "08:45"
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional
}, { _id: true });

const timetableSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    session: { type: String, required: true }, // e.g. "2025/2026"
    term: { type: String, required: true },    // e.g. "First Term"
    slots: [timetableSlotSchema],
  },
  { timestamps: true }
);

// One timetable per class per term
timetableSchema.index({ schoolId: 1, classId: 1, session: 1, term: 1 }, { unique: true });

export default mongoose.model("Timetable", timetableSchema);
