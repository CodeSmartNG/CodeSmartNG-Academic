import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center">
              <i className="fas fa-graduation-cap text-amber-400"></i>
            </div>
            <span className="font-bold text-slate-900 text-lg">CodeSmartNG</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-blue-700">Features</a>
            <a href="#pricing" className="hover:text-blue-700">Pricing</a>
            <Link to="/login" className="hover:text-blue-700">Sign In</Link>
            <Link to="/register-school" className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10"></div>
        <div className="absolute top-20 -right-32 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-200 rounded-full blur-3xl opacity-40"></div>
        
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-xs font-semibold mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            Trusted by Nigerian Schools
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Smart School Management.<br />
            <span className="text-blue-900">Better Learning.</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            Everything your nursery and primary school needs — pupils, teachers, results, fees, and parent communication — all in one powerful portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register-school" className="bg-blue-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-800 transition shadow-lg shadow-blue-900/30">
              Start Your Free Trial →
            </Link>
            <a href="#features" className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:border-blue-700 hover:text-blue-700 transition">
              See How It Works
            </a>
          </div>
          <p className="text-xs text-slate-400 mt-4">✓ 30 days free · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything Your School Needs
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              One platform to replace your paper registers, Excel sheets, and WhatsApp groups.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "fa-user-graduate", title: "Admissions & Pupils", desc: "Register new pupils, manage profiles, promote classes, and archive records — all digitally." },
              { icon: "fa-chalkboard-teacher", title: "Teachers & Classes", desc: "Assign form teachers, subject teachers, and timetables. Each teacher sees only their classes." },
              { icon: "fa-calendar-check", title: "Daily Attendance", desc: "Form teachers mark attendance with one tap. Parents see real-time attendance percentages." },
              { icon: "fa-award", title: "Results & Report Cards", desc: "Enter scores, auto-compute grades and positions, and generate beautiful PDF report cards." },
              { icon: "fa-naira-sign", title: "Fees & Payments", desc: "Create fee structures, generate bills, record manual payments, and track outstanding balances." },
              { icon: "fa-comments", title: "Parent Portal & Chat", desc: "Parents see results, fees, and announcements. Chat with teachers and admin directly." },
            ].map((f) => (
              <div key={f.title} className="bg-white p-8 rounded-2xl border border-slate-200 hover:shadow-xl transition">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                  <i className={`fas ${f.icon} text-blue-800 text-xl`}></i>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why CodeSmartNG ───────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Built for Nigerian Schools
            </h2>
            <div className="space-y-5">
              {[
                { title: "Multi-School Platform", desc: "Each school gets its own isolated database — your pupils' data is never mixed with another school." },
                { title: "Nursery & Primary Ready", desc: "Supports both developmental assessments (nursery) and numeric grading (primary)." },
                { title: "Naira-First Design", desc: "All fees are in ₦, all payments tracked in kobo, all receipts printable as PDFs." },
                { title: "Parent-First", desc: "Parents see exactly what matters: their child's results, attendance, and outstanding fees." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-10 text-white shadow-2xl">
            <div className="text-6xl font-bold mb-4">₦0</div>
            <div className="text-blue-200 text-lg mb-6">to get started</div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3"><i className="fas fa-check-circle text-amber-400"></i> 30-day free trial</li>
              <li className="flex items-center gap-3"><i className="fas fa-check-circle text-amber-400"></i> No setup fees</li>
              <li className="flex items-center gap-3"><i className="fas fa-check-circle text-amber-400"></i> Free staff training</li>
              <li className="flex items-center gap-3"><i className="fas fa-check-circle text-amber-400"></i> Cancel anytime</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-600">Choose the plan that fits your school. All plans include a free 30-day trial.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "5,000", pupils: "Up to 100 pupils", features: ["All core features", "Pupils, classes, attendance", "Results & report cards", "Email support"], popular: false },
              { name: "Standard", price: "10,000", pupils: "Up to 500 pupils", features: ["Everything in Starter", "Fees & payments", "Parent portal & chat", "Priority support"], popular: true },
              { name: "Premium", price: "20,000", pupils: "Unlimited pupils", features: ["Everything in Standard", "Multi-branch support", "Custom branding", "Dedicated account manager"], popular: false },
            ].map((plan) => (
              <div key={plan.name} className={`bg-white rounded-3xl p-8 border-2 ${plan.popular ? "border-blue-700 relative shadow-xl scale-105" : "border-slate-200"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-slate-900">₦{plan.price}<span className="text-base font-normal text-slate-500">/mo</span></div>
                  <p className="text-xs text-slate-500 mt-1">{plan.pupils}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <i className="fas fa-check text-green-600 text-xs"></i> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register-school" className={`block text-center py-3 rounded-xl font-semibold transition ${plan.popular ? "bg-blue-900 text-white hover:bg-blue-800" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}>
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-blue-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center">
              <i className="fas fa-graduation-cap text-blue-900"></i>
            </div>
            <span className="font-bold text-lg">CodeSmartNG Academic</span>
          </div>
          <p className="text-blue-200 text-sm mb-6">Smart School Management, Better Learning.</p>
          <div className="flex justify-center gap-6 text-sm text-blue-200">
            <Link to="/login" className="hover:text-white">Login</Link>
            <Link to="/register-school" className="hover:text-white">Register</Link>
            <a href="mailto:hello@codesmartng.com" className="hover:text-white">Contact</a>
          </div>
          <p className="text-xs text-blue-300 mt-8">© {new Date().getFullYear()} CodeSmartNG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
