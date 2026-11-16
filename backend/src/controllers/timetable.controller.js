import Timetable from "../models/Timetable.js";
import Class from "../models/Class.js";

// GET /api/timetables/class/:classId?session=&term=
export const getClassTimetable = async (req, res) => {
  try {
    const { classId } = req.params;
    const { session, term } = req.query;

    const timetable = await Timetable.findOne({ 
      schoolId: req.schoolId, 
      classId, 
      session, 
      term 
    }).populate("slots.subjectId", "name code")
      .populate("slots.teacherId", "fullName");

    res.json({ success: true, data: { timetable } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/timetables
// Body: { classId, session, term, slots: [...] }
export const saveTimetable = async (req, res) => {
  try {
    const { classId, session, term, slots } = req.body;

    const cls = await Class.findOne({ _id: classId, schoolId: req.schoolId });
    if (!cls) return res.status(404).json({ success: false, message: "Class not found" });

    // Upsert: Update if exists, Create if not
    const timetable = await Timetable.findOneAndUpdate(
      { schoolId: req.schoolId, classId, session, term },
      { slots },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "Timetable saved successfully", data: { timetable } });
  } catch (err) {
    console.error("saveTimetable error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
