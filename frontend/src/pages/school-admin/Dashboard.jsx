import { useEffect, useState } from "react";
import api from "../../services/api";

export default function SchoolAdminDashboard() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [parents, setParents] = useState([]);
  
  const [teacherForm, setTeacherForm] = useState({ fullName: "", email: "", password: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "" });
  const [parentForm, setParentForm] = useState({ fullName: "", email: "", password: "" });
  
  const [msg, setMsg] = useState(null);

  // Load data
  const loadData = () => {
    api.get("/users?role=teacher").then(({ data }) => setTeachers(data.data.users || [])).catch(console.error);
    api.get("/subjects").then(({ data }) => setSubjects(data.data.subjects || [])).catch(console.error);
    api.get("/users?role=parent").then(({ data }) => setParents(data.data.users || [])).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/users", { ...teacherForm, role: "teacher" });
      setMsg({ type: "success", text: "Teacher added!" });
      setTeacherForm({ fullName: "", email: "", password: "" });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add teacher" });
    }
  };

  // Create subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/subjects", subjectForm);
      setMsg({ type: "success", text: "Subject added!" });
      setSubjectForm({ name: "", code: "" });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add subject" });
    }
  };

  // Create parent
  const handleAddParent = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/users", { ...parentForm, role: "parent" });
      setMsg({ type: "success", text: "Parent added! You can now log in as them." });
      setParentForm({ fullName: "", email: "", password: "" });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add parent" });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">School Admin Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Welcome to CodeSmartNG Academic — manage your school here.</p>

      {msg && (
        <div className={`p-3 rounded-lg mb-6 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Add Teacher Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a New Teacher</h2>
          <form onSubmit={handleAddTeacher} className="space-y-4">
            <input required placeholder="Full Name" className="w-full border rounded-lg p-2" 
              value={teacherForm.fullName} onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })} />
            <input required type="email" placeholder="Email" className="w-full border rounded-lg p-2" 
              value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
            <input required type="text" placeholder="Temp Password" className="w-full border rounded-lg p-2" 
              value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} />
            <button type="submit" className="w-full bg-blue-700 text-white px-4 py-2 rounded-lg">+ Create Teacher</button>
          </form>
        </div>

        {/* Add Subject Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a New Subject</h2>
          <form onSubmit={handleAddSubject} className="space-y-4">
            <input required placeholder="Subject Name (e.g. Mathematics)" className="w-full border rounded-lg p-2" 
              value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
            <input placeholder="Subject Code (optional)" className="w-full border rounded-lg p-2" 
              value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
            <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-lg">+ Create Subject</button>
          </form>
        </div>

        {/* Add Parent Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a New Parent</h2>
          <form onSubmit={handleAddParent} className="space-y-4">
            <input required placeholder="Full Name" className="w-full border rounded-lg p-2" 
              value={parentForm.fullName} onChange={(e) => setParentForm({ ...parentForm, fullName: e.target.value })} />
            <input required type="email" placeholder="Email" className="w-full border rounded-lg p-2" 
              value={parentForm.email} onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })} />
            <input required type="text" placeholder="Temp Password" className="w-full border rounded-lg p-2" 
              value={parentForm.password} onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })} />
            <button type="submit" className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg">+ Create Parent</button>
          </form>
        </div>
      </div>

      {/* Lists */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Teachers ({teachers.length})</h2>
          {teachers.length === 0 ? <p className="text-sm text-slate-400">No teachers yet.</p> : (
            <ul className="divide-y">
              {teachers.map((t) => (
                <li key={t._id} className="py-2 text-sm">
                  <div className="font-medium text-slate-800">{t.fullName}</div>
                  <div className="text-xs text-slate-500">{t.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Subjects ({subjects.length})</h2>
          {subjects.length === 0 ? <p className="text-sm text-slate-400">No subjects yet.</p> : (
            <ul className="divide-y">
              {subjects.map((s) => (
                <li key={s._id} className="py-2 text-sm flex justify-between">
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="text-xs font-mono text-slate-500">{s.code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Parents ({parents.length})</h2>
          {parents.length === 0 ? <p className="text-sm text-slate-400">No parents yet.</p> : (
            <ul className="divide-y">
              {parents.map((p) => (
                <li key={p._id} className="py-2 text-sm">
                  <div className="font-medium text-slate-800">{p.fullName}</div>
                  <div className="text-xs text-slate-500">{p.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
