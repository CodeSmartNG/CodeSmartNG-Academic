import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (password.length < 6) {
      setMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setMsg({ type: "success", text: "Password reset successful! Redirecting to login…" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.message || "Reset failed. The link may have expired.",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][passwordStrength()];
  const strengthColor = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"][passwordStrength()];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Left Panel: Branding ─────────────────────────── */}
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
              Set a New<br />
              <span className="text-amber-400">Password.</span>
            </h1>
            <p className="text-blue-100">
              Choose a strong password that you don't use anywhere else.
            </p>
            <div className="mt-8 space-y-2 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-amber-400"></i>
                At least 6 characters
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-amber-400"></i>
                Mix of letters, numbers, symbols
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-check-circle text-amber-400"></i>
                Unique to CodeSmartNG
              </div>
            </div>
          </div>

          <p className="text-blue-200 text-xs">© {new Date().getFullYear()} CodeSmartNG</p>
        </div>
      </div>

      {/* ── Right Panel: Form ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lock text-blue-700 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Reset Your Password</h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your new password below
              </p>
            </div>

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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= passwordStrength() ? strengthColor : "bg-slate-200"
                          }`}
                        ></div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Strength: {strengthLabel}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-700/30 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Resetting…</>
                ) : (
                  <>Reset Password <i className="fas fa-arrow-right text-sm"></i></>
                )}
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
