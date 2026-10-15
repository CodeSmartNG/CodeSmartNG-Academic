import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    submittedAt: { type: Date, default: Date.now },
    // Pupil's written/typed response (optional — many Nigerian schools use paper)
    textResponse: { type: String, trim: true, maxlength: 3000 },
    attachments: [{ url: String, name: String, size: Number }],
    // Teacher marks
    status: {
      type: String,
      enum: ["submitted", "completed", "outstanding", "late"],
      default: "submitted",
    },
    teacherRemark: { type: String, trim: true, maxlength: 500 },
    markedAt: Date,
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

const homeworkSchema = new mongoose.Schema(
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },

    attachments: [{ url: String, name: String, size: Number }],

    assignedDate: { type: Date, default: Date.now, index: true },
    dueDate: { type: Date, required: true, index: true },

    session: { type: String, required: true, index: true },
    term: { type: String, required: true, index: true },

    // Pupils who must submit (snapshot of active class list at creation)
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],

    submissions: [submissionSchema],

    isPublished: { type: Boolean, default: true },
    allowTextSubmission: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

homeworkSchema.index({ schoolId: 1, classId: 1, dueDate: -1 });
homeworkSchema.index({ schoolId: 1, teacherId: 1, createdAt: -1 });
homeworkSchema.index({ schoolId: 1, subjectId: 1, session: 1, term: 1 });

// Virtual: submission count and completion rate
homeworkSchema.virtual("stats").get(function () {
  const total = this.assignedTo.length;
  const submitted = this.submissions.length;
  const completed = this.submissions.filter((s) => s.status === "completed").length;
  const outstanding = this.submissions.filter((s) => s.status === "outstanding").length;
  return { total, submitted, completed, outstanding, pending: total - submitted };
});

export default mongoose.model("Homework", homeworkSchema);
