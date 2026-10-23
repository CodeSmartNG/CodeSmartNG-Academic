import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post("/auth/forgot-password", { email, schoolSlug });
      setMsg({ type: "success", text: data.message });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center">
              <i className="fas fa-graduation-cap text-blue-900 text-xl"></i>
            </div>
            <div>
              <div className="font-bold text-white text-lg">CodeSmartNG</div>
              <div className="text-xs text-blue-200">Academic Portal</div>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Forgot Your<br /><span className="text-amber-400">Password?</span>
            </h1>
            <p className="text-blue-100">No worries. Enter your email and we'll send you a link to reset it.</p>
          </div>
          <p className="text-blue-200 text-xs">© {new Date().getFullYear()} CodeSmartNG</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
            <p className="text-sm text-slate-500 mb-6">We'll email you a reset link.</p>

            {msg && (
              <div className={`mb-4 p-3 rounded-xl text-sm ${
                msg.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}>
                {msg.text}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">School Slug (optional)</label>
                <div className="relative">
                  <i className="fas fa-school absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="e.g. bright-future"
                    value={schoolSlug}
                    onChange={(e) => setSchoolSlug(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type="email"
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="you@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white py-3 rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Sending…</> : <>Send Reset Link <i className="fas fa-arrow-right text-sm"></i></>}
              </button>
            </form>

            <div className="text-center mt-6 text-sm">
              <Link to="/login" className="text-blue-700 hover:underline font-medium">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
