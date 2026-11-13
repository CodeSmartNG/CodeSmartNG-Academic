import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function RegisterSchool() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    tracks: [], // 👈 SAS: Empty array for selected levels
    schoolName: "",
    address: "",
    email: "",
    phone: "",
    proprietorName: "",
    password: "",
  });

  const update = (field, value) => setForm({ ...form, [field]: value });

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Generate a preview slug from the school name
  const slugPreview = form.schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, ""); // SAS Fix: strip leading/trailing dashes

  const passwordStrength = () => {
    let score = 0;
    if (form.password.length >= 8) score++;
    if (/[A-Z]/.test(form.password)) score++;
    if (/[0-9]/.test(form.password)) score++;
    if (/[^A-Za-z0-9]/.test(form.password)) score++;
    return score;
  };

  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][passwordStrength()];
  const strengthColor = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"][passwordStrength()];

  const validateStep = (s) => {
    if (s === 1) {
      if (form.tracks.length === 0) return "Please select at least one school level";
    }
    if (s === 2) {
      if (!form.schoolName.trim()) return "Please enter your school name";
      if (!form.address.trim()) return "Please enter your school address";
    }
    if (s === 3) {
      if (!form.email.trim()) return "Please enter your email";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email";
      if (!form.phone.trim()) return "Please enter your phone number";
    }
    if (s === 4) {
      if (!form.proprietorName.trim()) return "Please enter the proprietor's name";
      if (form.password.length < 8) return "Password must be at least 8 characters";
      if (passwordStrength() < 2) return "Password is too weak. Add letters, numbers, or symbols.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) return setError(err);
    setError("");
    setStep(step + 1);
  };

  const back = () => {
    setError("");
    setShowPassword(false);
    setStep(step - 1);
  };

  const submit = async (e) => {
    e.preventDefault();
    // Validate all steps before submitting
    for (let s = 1; s <= 4; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        setError(err);
        return;
      }
    }

    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register-school", { ...form, slug: slugPreview });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check-circle text-green-600 text-5xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your <strong>{form.tracks.includes("secondary") ? (form.tracks.includes("nursery_primary") ? "combined Primary & Secondary" : "Secondary") : "Primary"}</strong> school has been registered. The CodeSmartNG Super Admin will review and approve your account shortly. You will be notified by email.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-blue-800 font-semibold mb-1">Next Steps:</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Await approval (typically within 24 hours)</li>
              <li>Check your email for confirmation</li>
              <li>Log in with your credentials</li>
            </ol>
          </div>
          <Link
            to="/login"
            className="inline-block w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration Form ─────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* ── Left Panel: Branding ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <i className="fas fa-graduation-cap text-blue-900 text-xl"></i>
            </div>
            <div>
              <div className="font-bold text-white text-lg leading-tight">CodeSmartNG</div>
              <div className="text-xs text-blue-200">Academic Portal</div>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Start Your<br />
              <span className="text-amber-400">Digital Journey</span><br />
              Today.
            </h1>
            <p className="text-blue-100 text-lg max-w-md">
              Join leading Nigerian schools using CodeSmartNG to automate their operations. First month free.
            </p>

            <div className="space-y-3 pt-4">
              {[
                { icon: "fa-rocket", text: "First month free — no credit card" },
                { icon: "fa-shield-alt", text: "Bank-grade security & data isolation" },
                { icon: "fa-headset", text: "Free onboarding & training for staff" },
                { icon: "fa-chart-line", text: "Real-time insights on your school" },
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

          <div className="text-blue-200 text-xs">
            <i className="fas fa-lock mr-1"></i>
            Your data is encrypted and never shared
          </div>
        </div>
      </div>

      {/* ── Right Panel: Registration Form ────────────────── */}
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

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Step {step} of 4
                </span>
                <span className="text-xs text-slate-400">
                  {step === 1 && "School Levels"}
                  {step === 2 && "School Info"}
                  {step === 3 && "Contact"}
                  {step === 4 && "Account"}
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-700 to-blue-900 transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {step === 1 && "What levels does your school run?"}
                {step === 2 && "Tell us about your school"}
                {step === 3 && "How can we reach you?"}
                {step === 4 && "Create your account"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {step === 1 && "You can select both if you run a combined school."}
                {step === 2 && "Basic information about your school"}
                {step === 3 && "Contact details for your school"}
                {step === 4 && "Set up your login credentials"}
              </p>
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4">
                <i className="fas fa-exclamation-circle text-red-600 mt-0.5"></i>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 4) next();
                else submit(e);
              }} 
              className="space-y-4"
            >
              {/* ── Step 1: School Levels (SAS) ─────────────── */}
              {step === 1 && (
                <div className="space-y-3">
                  <label 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                      form.tracks.includes("nursery_primary") ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 w-5 h-5 text-blue-600 rounded"
                      checked={form.tracks.includes("nursery_primary")}
                      onChange={(e) => {
                        if (e.target.checked) update("tracks", [...form.tracks, "nursery_primary"]);
                        else update("tracks", form.tracks.filter(t => t !== "nursery_primary"));
                      }}
                    />
                    <div>
                      <div className="font-semibold text-slate-800">Nursery & Primary</div>
                      <div className="text-xs text-slate-500 mt-0.5">Pre-Nursery through Primary 6</div>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                      form.tracks.includes("secondary") ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 w-5 h-5 text-blue-600 rounded"
                      checked={form.tracks.includes("secondary")}
                      onChange={(e) => {
                        if (e.target.checked) update("tracks", [...form.tracks, "secondary"]);
                        else update("tracks", form.tracks.filter(t => t !== "secondary"));
                      }}
                    />
                    <div>
                      <div className="font-semibold text-slate-800">Secondary School</div>
                      <div className="text-xs text-slate-500 mt-0.5">JSS 1-3 and SSS 1-3 (Sciences, Arts, Commercial)</div>
                    </div>
                  </label>
                </div>
              )}

              {/* ── Step 2: School Info ─────────────────────── */}
              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      School Name
                    </label>
                    <div className="relative">
                      <i className="fas fa-school absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                      <input
                        type="text"
                        name="organization"
                        autoComplete="organization"
                        className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        placeholder="e.g. Bright Future Academy"
                        value={form.schoolName}
                        onChange={(e) => update("schoolName", e.target.value)}
                        required
                      />
                    </div>
                    {slugPreview && (
                      <p className="text-xs text-slate-400 mt-1">
                        Your URL: <span className="font-mono text-blue-700">{slugPreview}.codesmartng.com</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      School Address
                    </label>
                    <div className="relative">
                      <i className="fas fa-map-marker-alt absolute left-4 top-4 text-slate-400 text-sm"></i>
                      <textarea
                        rows="3"
                        name="address"
                        autoComplete="street-address"
                        className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition resize-none"
                        placeholder="e.g. 12 Adeola Street, Ikeja, Lagos"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        required
                      ></textarea>
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 3: Contact ─────────────────────────── */}
              {step === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      School Email
                    </label>
                    <div className="relative">
                      <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        placeholder="admin@school.com"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      School Phone
                    </label>
                    <div className="relative">
                      <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                      <input
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        placeholder="08012345678"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 4: Account ─────────────────────────── */}
              {step === 4 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Proprietor's Full Name
                    </label>
                    <div className="relative">
                      <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        placeholder="e.g. Mrs. Folake Adeyemi"
                        value={form.proprietorName}
                        onChange={(e) => update("proprietorName", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="new-password"
                        autoComplete="new-password"
                        className="w-full border border-slate-200 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                        placeholder="At least 8 characters"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                      </button>
                    </div>
                    {form.password && (
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
                </>
              )}

              {/* ── Navigation Buttons ─────────────────────── */}
              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={back}
                    className="flex-1 border-2 border-slate-200 hover:border-slate-300 text-slate-700 py-3 rounded-xl font-semibold transition"
                  >
                    Back
                  </button>
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="flex-1 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-700/30 transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <i className="fas fa-arrow-right text-sm"></i>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-700/30 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Creating…
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket"></i>
                        Create Account
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">Already registered?</span>
              </div>
            </div>

            <Link
              to="/login"
              className="block text-center w-full border-2 border-slate-200 hover:border-blue-700 hover:text-blue-700 text-slate-700 py-3 rounded-xl font-semibold transition-all mt-4"
            >
              Sign In Instead
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By registering, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
