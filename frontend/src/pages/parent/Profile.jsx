import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { parentApi } from "../../services/parentApi";

export default function ParentProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone || "" });
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await parentApi.updateProfile(form);
      setUser({ ...user, ...data.data.user });
      localStorage.setItem("csn_user", JSON.stringify({ ...user, ...data.data.user }));
      setMsg({ type: "success", text: "Profile updated" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed" });
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>{msg.text}</div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600">Full Name</span>
          <input className="mt-1 w-full border rounded-lg p-2"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Email</span>
          <input className="mt-1 w-full border rounded-lg p-2 bg-slate-50"
            value={user.email} disabled />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Phone</span>
          <input className="mt-1 w-full border rounded-lg p-2"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <button className="bg-blue-700 text-white px-5 py-2 rounded-lg">
          Save Changes
        </button>
      </form>
    </div>
  );
}
