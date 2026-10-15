import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return setError("Passwords don't match");
    if (form.newPassword.length < 6) return setError("Min 6 characters");

    setSaving(true);
    setError("");
    try {
      await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      // Clear mustChangePassword flag locally
      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);
      localStorage.setItem("csn_user", JSON.stringify(updatedUser));

      setMsg({ type: "success", text: "Password changed successfully!" });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Change Password</h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg.text}</div>}

      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <input className="w-full border rounded-lg p-3" type="password"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          required />
        <input className="w-full border rounded-lg p-3" type="password"
          placeholder="New password"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          required minLength={6} />
        <input className="w-full border rounded-lg p-3" type="password"
          placeholder="Confirm new password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          required />
        <button disabled={saving}
          className="w-full bg-blue-700 text-white p-3 rounded-lg font-medium disabled:opacity-50">
          {saving ? "Saving…" : "Change Password"}
        </button>
      </form>
    </div>
  );
}
