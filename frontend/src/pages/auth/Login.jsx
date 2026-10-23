import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", schoolSlug: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password, form.schoolSlug || undefined);
      window.location.href = "/dashboard";
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Left Panel: Branding (hidden on mobile) ───────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <i className="fas fa-graduation-cap text-blue-900 text-xl"></i>
            </div>
            <div>
              <div className="font-bold text-white text-lg leading-tight">CodeSmartNG</div>
              <div className="text-xs text-blue-200">Academic Portal</div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Smart School<br />
              Management,<br />
              <span className="text-amber-400">Better Learning.</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-md">
              Everything your nursery and primary school needs — pupils, teachers, results, fees, and parent communication — all in one portal.
            </p>

            {/* Feature bullets */}
            <div className="space-y-3 pt-4">
              {[
                { icon: "fa-user-graduate", text: "Manage pupils & admissions" },
                { icon: "fa-award", text: "Results & report cards" },
                { icon: "fa-naira-sign", text: "Fees & payment tracking" },
                { icon: "fa-comments", text: "Chat with teachers & parents" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 text-blue-100">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <i className={`fas ${f.icon} text-amber-400 text-sm`}></i>
                  </div>
                  <span className="text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust signal */}
          <div className="flex items-center gap-3 text-blue-200 text-xs">
            <div className="flex -space-x-2">
              {["A", "B", "C", "D"].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-amber-400 border-2 border-blue-900 flex items-center justify-center text-blue-900 font-bold text-xs"
                >
                  {l}
                </div>
              ))}
            </div>
            <span>Trusted by schools across Nigeria</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center">
              <i className="fas fa-graduation-cap text-amber-400 text-xl"></i>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg leading-tight">CodeSmartNG</div>
              <div className="text-xs text-slate-500">Academic Portal</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <i className="fas fa-exclamation-circle text-red-600 mt-0.5"></i>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  School Slug <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <i className="fas fa-school absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    placeholder="e.g. bright-future"
                    value={form.schoolSlug}
                    onChange={(e) => setForm({ ...form, schoolSlug: e.target.value })}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Leave blank for Super Admin</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type="email"
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    placeholder="you@school.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-blue-700 hover:underline font-medium">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-700/30 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <i className="fas fa-arrow-right text-sm"></i>
                  </>
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">New to CodeSmartNG?</span>
              </div>
            </div>

            <Link
              to="/register-school"
              className="block text-center w-full border-2 border-slate-200 hover:border-blue-700 hover:text-blue-700 text-slate-700 py-3 rounded-xl font-semibold transition-all"
            >
              Register Your School
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            © {new Date().getFullYear()} CodeSmartNG Academic · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
