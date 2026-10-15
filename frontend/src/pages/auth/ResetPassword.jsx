import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    setError("");
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      alert("Password reset successful. Please log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Reset Password</h1>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

        <input
          className="w-full border rounded-lg p-3"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="w-full border rounded-lg p-3"
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "Resetting…" : "Reset Password"}
        </button>

        <div className="text-center text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">← Back to login</Link>
        </div>
      </form>
    </div>
  );
}
