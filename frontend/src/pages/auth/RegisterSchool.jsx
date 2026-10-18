import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function RegisterSchool() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    schoolName: "", email: "", phone: "", address: "",
    proprietorName: "", password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/auth/register-school", form);
      alert("School registered! Awaiting CodeSmartNG approval.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Register Your School</h1>
        <p className="text-sm text-slate-500">We'll review your application and approve it shortly.</p>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

        <input className="w-full border rounded-lg p-3" placeholder="School name (e.g. Bright Future Academy)" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} required />
        <input className="w-full border rounded-lg p-3" type="email" placeholder="School email (e.g. admin@school.com)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full border rounded-lg p-3" placeholder="School phone (e.g. 08012345678)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input className="w-full border rounded-lg p-3" placeholder="School address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <input className="w-full border rounded-lg p-3" placeholder="Proprietor's full name" value={form.proprietorName} onChange={(e) => setForm({ ...form, proprietorName: e.target.value })} required />
        <input className="w-full border rounded-lg p-3" type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />

        <button disabled={saving} className="w-full bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-lg font-medium disabled:opacity-50">
          {saving ? "Registering…" : "Register School"}
        </button>

        <div className="text-center text-sm pt-2">
          <Link to="/login" className="text-blue-600 hover:underline">Already have an account? Log in</Link>
        </div>
      </form>
    </div>
  );
}
