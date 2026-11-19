
import mongoose from "mongoose";

const examRegistrationSchema = new mongoose.Schema(
  {
    // School isolation (Multi-tenant)
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    // Registered student
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    // Examination type
    examType: {
      type: String,
      enum: ["WAEC", "NECO", "NABTEB"],
      required: true,
      uppercase: true,
      trim: true,
    },

    // Examination year
    examYear: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4}$/, "Enter a valid examination year."],
    },

    // Registered examination subjects
    subjects: {
      type: [
        {
          type: String,
          required: true,
          trim: true,
        },
      ],
      required: true,
      validate: [
        {
          validator: (subjects) =>
            subjects.length >= 1 && subjects.length <= 15,
          message: "A student must register between 1 and 15 subjects.",
        },
        {
          validator: (subjects) =>
            subjects.every((subject) => subject.length > 0),
          message: "Subject names cannot be empty.",
        },
      ],
    },

    // Registration status
    status: {
      type: String,
      enum: ["pending", "registered", "completed"],
      default: "pending",
      index: true,
    },

    // Examination scratch-card PIN
    pinIssued: {
      type: String,
      default: "",
      trim: true,
    },

    // Examination registration fee
    totalFee: {
      type: Number,
      required: true,
      min: [0, "Examination fee cannot be negative."],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate registration for the same student,
// examination type, school and year.
examRegistrationSchema.index(
  {
    schoolId: 1,
    studentId: 1,
    examType: 1,
    examYear: 1,
  },
  {
    unique: true,
    name: "unique_student_exam_registration",
  }
);

// Improve school examination searches
examRegistrationSchema.index({
  schoolId: 1,
  examType: 1,
  examYear: 1,
  createdAt: -1,
});

// Remove duplicate subjects before validation
examRegistrationSchema.pre("validate", function () {
  if (Array.isArray(this.subjects)) {
    this.subjects = [
      ...new Set(
        this.subjects.map((subject) =>
          typeof subject === "string"
            ? subject.trim()
            : subject
        )
      ),
    ];
  }
});

const ExamRegistration =
  mongoose.models.ExamRegistration ||
  mongoose.model("ExamRegistration", examRegistrationSchema);

export default ExamRegistration;
