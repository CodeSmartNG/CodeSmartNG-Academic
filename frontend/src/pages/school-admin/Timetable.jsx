import { useEffect, useState } from "react";
import { classApi } from "../../services/classApi";
import { subjectApi } from "../../services/classApi";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function TimetablePage() {
  const { activeTrack } = useAuth();
  const isSecondary = activeTrack === "secondary";

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    classId: "", session: "2025/2026", term: "First Term"
  });

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // 1. Load Classes and Subjects
  useEffect(() => {
    Promise.all([
      classApi.list({ track: activeTrack }),
      subjectApi.list({ track: activeTrack }),
    ]).then(([c, s]) => {
      setClasses(c.data.data.classes);
      setSubjects(s.data.data.subjects);
    });
  }, [activeTrack]);

  // 2. Load Timetable when class/session/term changes
  const loadTimetable = () => {
    if (!filters.classId) return;
    setLoading(true);
    api.get(`/timetables/class/${filters.classId}`, { params: { session: filters.session, term: filters.term } })
      .then(({ data }) => {
        setSlots(data.data.timetable?.slots || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadTimetable, [filters]);

  // 3. Handlers
  const addSlot = (day) => {
    setSlots([...slots, { day, startTime: "08:00", endTime: "08:45", subjectId: "" }]);
  };

  const updateSlot = (index, field, value) => {
    const next = [...slots];
    next[index][field] = value;
    setSlots(next);
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!filters.classId) return alert("Please select a class first");
    
    // Validate that all slots have a subject
    const invalid = slots.some(s => !s.subjectId);
    if (invalid) return alert("Please select a subject for all slots, or remove empty ones.");

    setSaving(true);
    setMsg(null);
    try {
      await api.post("/timetables", { ...filters, slots });
      setMsg({ type: "success", text: "Timetable saved successfully!" });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to save timetable" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {isSecondary ? "Secondary" : "Primary"} Timetable
        </h1>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select className="border rounded-lg p-2" value={filters.classId}
          onChange={(e) => setFilters({ ...filters, classId: e.target.value })}>
          <option value="">Select Class...</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input className="border rounded-lg p-2" value={filters.session}
          onChange={(e) => setFilters({ ...filters, session: e.target.value })} />
        <select className="border rounded-lg p-2" value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
          <option>First Term</option><option>Second Term</option><option>Third Term</option>
        </select>
        <button onClick={loadTimetable} className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4 py-2 font-medium">
          Load Timetable
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading timetable...</p>
      ) : !filters.classId ? (
        <div className="bg-white p-10 rounded-xl text-center text-slate-500 shadow-sm">
          Select a class above to view or create its timetable.
        </div>
      ) : (
        <div className="space-y-6">
          {DAYS.map((day) => {
            const daySlots = slots.map((s, i) => ({ ...s, originalIndex: i })).filter(s => s.day === day);
            
            return (
              <div key={day} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
                  <h2 className="font-bold text-slate-700">{day}</h2>
                  <button onClick={() => addSlot(day)} className="text-sm text-blue-600 font-medium hover:underline">
                    + Add Period
                  </button>
                </div>
                
                <div className="p-4 space-y-3">
                  {daySlots.length === 0 ? (
                    <p className="text-sm text-slate-400">No classes scheduled for {day}.</p>
                  ) : (
                    daySlots.map((slot) => (
                      <div key={slot.originalIndex} className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                        <input type="time" className="border rounded-lg p-2 text-sm w-32" 
                          value={slot.startTime} onChange={(e) => updateSlot(slot.originalIndex, "startTime", e.target.value)} />
                        <span className="text-slate-400">-</span>
                        <input type="time" className="border rounded-lg p-2 text-sm w-32" 
                          value={slot.endTime} onChange={(e) => updateSlot(slot.originalIndex, "endTime", e.target.value)} />
                        
                        <select className="border rounded-lg p-2 text-sm flex-1"
                          value={slot.subjectId} onChange={(e) => updateSlot(slot.originalIndex, "subjectId", e.target.value)}>
                          <option value="">Select Subject...</option>
                          {subjects.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                        </select>

                        <button onClick={() => removeSlot(slot.originalIndex)} className="text-red-500 hover:text-red-700 p-2">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-4">
            <button onClick={save} disabled={saving}
              className="bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg disabled:opacity-50">
              {saving ? "Saving..." : "Save Timetable"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
