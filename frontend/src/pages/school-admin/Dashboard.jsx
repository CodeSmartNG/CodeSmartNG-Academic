import { useEffect, useState } from "react";
import api from "../../services/api";

export default function SchoolAdminDashboard() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [msg, setMsg] = useState(null);

  // Load teachers on mount
  const loadTeachers = () => {
    api.get("/users?role=teacher")
      .then(({ data }) => setTeachers(data.data.users || []))
      .catch((err) => console.error("Failed to load teachers", err));
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // Create teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/users", {
        ...form,
        role: "teacher",
      });
      setMsg({ type: "success", text: "Teacher added successfully!" });
      setForm({ fullName: "", email: "", password: "" });
      loadTeachers(); // Refresh the list
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add teacher" });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        School Admin Dashboard
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Welcome to CodeSmartNG Academic — use the sidebar to manage your school.
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card label="Active Pupils" color="blue" />
        <Card label="Classes" color="green" />
        <Card label="Present Today" color="amber" />
        <Card label="Outstanding Fees" color="red" />
      </div>

      {/* Add Teacher Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-slate-700 mb-4">Add a New Teacher</h2>
        
        {msg && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <label>
            <span className="text-sm text-slate-600">Full Name</span>
            <input required className="mt-1 w-full border rounded-lg p-2" 
              value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </label>
          <label>
            <span className="text-sm text-slate-600">Email</span>
            <input required type="email" className="mt-1 w-full border rounded-lg p-2" 
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            <span className="text-sm text-slate-600">Temp Password</span>
            <input required type="text" className="mt-1 w-full border rounded-lg p-2" 
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg h-10">
            + Create Teacher
          </button>
        </form>
      </div>

      {/* Teachers List */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-slate-700 mb-4">My Teachers ({teachers.length})</h2>
        {teachers.length === 0 ? (
          <p className="text-sm text-slate-400">No teachers added yet.</p>
        ) : (
          <ul className="divide-y">
            {teachers.map((t) => (
              <li key={t._id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium text-slate-800">{t.fullName}</div>
                  <div className="text-xs text-slate-500">{t.email}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-2">Getting started</h2>
        <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
          <li>Admit pupils from the <strong>Pupils</strong> menu</li>
          <li>Create classes and assign teachers under <strong>Classes</strong></li>
          <li>Record daily attendance, results and fees</li>
          <li>Publish announcements for parents</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ label, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="text-2xl font-bold">—</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}
