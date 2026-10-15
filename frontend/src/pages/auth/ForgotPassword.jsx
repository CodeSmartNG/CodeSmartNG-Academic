import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post("/auth/forgot-password", { email, schoolSlug });
      setMsg({ type: "success", text: data.message });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Forgot Password</h1>
        <p className="text-sm text-slate-500">
          Enter your email and we'll send a reset link.
        </p>

        {msg && (
          <div className={`p-3 rounded-lg text-sm ${
            msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {msg.text}
          </div>
        )}

        <input
          className="w-full border rounded-lg p-3"
          placeholder="School slug (optional)"
          value={schoolSlug}
          onChange={(e) => setSchoolSlug(e.target.value)}
        />
        <input
          className="w-full border rounded-lg p-3"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>

        <div className="text-center text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">← Back to login</Link>
        </div>
      </form>
    </div>
  );
}
