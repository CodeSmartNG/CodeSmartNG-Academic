import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom"; // 👈 ADDED for Paystack verification
import api from "../../services/api";
import ImageUpload from "../../components/ImageUpload";

export default function SchoolAdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams(); // 👈 ADDED

  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [parents, setParents] = useState([]);
  
  const [teacherForm, setTeacherForm] = useState({ fullName: "", email: "", password: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "" });
  const [parentForm, setParentForm] = useState({ fullName: "", email: "", password: "" });
  
  // Bank Details
  const [bankForm, setBankForm] = useState({ bankName: "", accountName: "", accountNumber: "" });
  const [bankMsg, setBankMsg] = useState(null);
  const [msg, setMsg] = useState(null);

  // School Logo Upload
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMsg, setLogoMsg] = useState(null);

  // Subscription Status
  const [schoolData, setSchoolData] = useState(null);
  const [paying, setPaying] = useState(false);

  // Load data on mount
  const loadData = () => {
    api.get("/users?role=teacher").then(({ data }) => setTeachers(data.data.users || [])).catch(console.error);
    api.get("/subjects").then(({ data }) => setSubjects(data.data.subjects || [])).catch(console.error);
    api.get("/users?role=parent").then(({ data }) => setParents(data.data.users || [])).catch(console.error);
    
    // Load existing school settings
    api.get("/schools/mine").then(({ data }) => {
      const school = data.data.school;
      setSchoolData(school);
      if (school?.settings?.bankDetails) setBankForm(school.settings.bankDetails);
      if (school?.logoUrl) setLogoUrl(school.logoUrl);
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();

    // 👇 PAYSTACK VERIFICATION LOGIC
    const reference = searchParams.get("reference");
    const paymentStatus = searchParams.get("payment");

    if (paymentStatus === "success" && reference) {
      // Tell the backend to verify this reference securely
      api.get(`/subscriptions/verify/${reference}`)
        .then(({ data }) => {
          if (data.success) {
            alert("Payment successful! Your subscription has been renewed.");
            loadData(); // Reload school data to hide the red banner
            setSearchParams({}); // Clear the URL parameters so it doesn't loop
          }
        })
        .catch((err) => {
          console.error("Verification failed", err);
        });
    }
  }, [searchParams, setSearchParams]);

  // Create teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/users", { ...teacherForm, role: "teacher" });
      setMsg({ type: "success", text: "Teacher added!" });
      setTeacherForm({ fullName: "", email: "", password: "" });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add teacher" });
    }
  };

  // Create subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/subjects", subjectForm);
      setMsg({ type: "success", text: "Subject added!" });
      setSubjectForm({ name: "", code: "" });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add subject" });
    }
  };

  // Create parent
  const handleAddParent = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/users", { ...parentForm, role: "parent" });
      setMsg({ type: "success", text: "Parent added! You can now log in as them." });
      setParentForm({ fullName: "", email: "", password: "" });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add parent" });
    }
  };

  // Save bank details
  const handleSaveBank = async (e) => {
    e.preventDefault();
    setBankMsg(null);
    try {
      await api.patch("/schools/mine", {
        settings: { bankDetails: bankForm }
      });
      setBankMsg({ type: "success", text: "Bank details saved! Parents will now see these when paying." });
      loadData();
    } catch (err) {
      setBankMsg({ type: "error", text: err.response?.data?.message || "Failed to save bank details" });
    }
  };

  // Save Logo URL
  const handleSaveLogo = async (url) => {
    try {
      await api.patch("/schools/mine", { logoUrl: url });
      setLogoUrl(url);
      setLogoMsg({ type: "success", text: "Logo updated successfully!" });
      setTimeout(() => setLogoMsg(null), 3000);
    } catch (err) {
      setLogoMsg({ type: "error", text: "Failed to save logo" });
    }
  };

  // Handle Subscription Upgrade
  const handleUpgrade = async (plan) => {
    try {
      setPaying(true);
      const { data } = await api.post("/subscriptions/initialize", { plan });
      window.location.href = data.data.authorization_url;
    } catch (err) {
      alert("Failed to initialize payment. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // Check if subscription is expiring or expired
  const isExpiring = () => {
    if (!schoolData?.subscriptionExpiresAt) return false;
    const expiry = new Date(schoolData.subscriptionExpiresAt);
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return expiry < threeDaysFromNow;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">School Admin Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Welcome to CodeSmartNG Academic — manage your school here.</p>

      {/* 👇 SUBSCRIPTION ALERT BANNER */}
      {isExpiring() && (
        <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded-xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div>
            <h3 className="font-bold text-red-800 text-lg flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i> Subscription Expiring!
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Your subscription expired or will expire on <strong>{new Date(schoolData.subscriptionExpiresAt).toLocaleDateString()}</strong>. Renew now to keep your school active.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleUpgrade("starter")} 
              disabled={paying}
              className="bg-white border border-red-600 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
            >
              Starter ₦5,000
            </button>
            <button 
              onClick={() => handleUpgrade("standard")} 
              disabled={paying}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
            >
              Standard ₦10,000
            </button>
            <button 
              onClick={() => handleUpgrade("premium")} 
              disabled={paying}
              className="bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-900 transition"
            >
              Premium ₦20,000
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div className={`p-3 rounded-lg mb-6 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* School Logo & Branding Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h2 className="font-semibold text-slate-700 mb-2 text-lg">School Logo & Branding</h2>
          <p className="text-sm text-slate-500 mb-2">
            Upload your school logo. It will appear on the parent dashboard, report cards, and PDFs.
          </p>
          {logoMsg && (
            <div className={`text-sm font-medium ${logoMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {logoMsg.text}
            </div>
          )}
        </div>
        <div className="ml-auto flex-shrink-0">
          <ImageUpload 
            currentImage={logoUrl} 
            onUploadSuccess={handleSaveLogo} 
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Add Teacher Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a New Teacher</h2>
          <form onSubmit={handleAddTeacher} className="space-y-4">
            <input required placeholder="Full Name" className="w-full border rounded-lg p-2" 
              value={teacherForm.fullName} onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })} />
            <input required type="email" placeholder="Email" className="w-full border rounded-lg p-2" 
              value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
            <input required type="text" placeholder="Temp Password" className="w-full border rounded-lg p-2" 
              value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} />
            <button type="submit" className="w-full bg-blue-700 text-white px-4 py-2 rounded-lg">+ Create Teacher</button>
          </form>
        </div>

        {/* Add Subject Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a New Subject</h2>
          <form onSubmit={handleAddSubject} className="space-y-4">
            <input required placeholder="Subject Name (e.g. Mathematics)" className="w-full border rounded-lg p-2" 
              value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
            <input placeholder="Subject Code (optional)" className="w-full border rounded-lg p-2" 
              value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
            <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-lg">+ Create Subject</button>
          </form>
        </div>

        {/* Add Parent Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a New Parent</h2>
          <form onSubmit={handleAddParent} className="space-y-4">
            <input required placeholder="Full Name" className="w-full border rounded-lg p-2" 
              value={parentForm.fullName} onChange={(e) => setParentForm({ ...parentForm, fullName: e.target.value })} />
            <input required type="email" placeholder="Email" className="w-full border rounded-lg p-2" 
              value={parentForm.email} onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })} />
            <input required type="text" placeholder="Temp Password" className="w-full border rounded-lg p-2" 
              value={parentForm.password} onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })} />
            <button type="submit" className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg">+ Create Parent</button>
          </form>
        </div>
      </div>

      {/* School Bank Account */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6 mb-8">
        <h2 className="font-semibold text-slate-700 mb-4">School Bank Account (for Fees)</h2>
        {bankMsg && <div className={`p-3 rounded mb-3 text-sm ${bankMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{bankMsg.text}</div>}
        <form onSubmit={handleSaveBank} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input required placeholder="Bank Name (e.g. GTBank)" className="border rounded-lg p-2" 
            value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
          <input required placeholder="Account Name" className="border rounded-lg p-2" 
            value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} />
          <input required placeholder="Account Number" className="border rounded-lg p-2" 
            value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg md:col-span-3">Save Bank Details</button>
        </form>
      </div>

      {/* Lists */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Teachers ({teachers.length})</h2>
          {teachers.length === 0 ? <p className="text-sm text-slate-400">No teachers yet.</p> : (
            <ul className="divide-y">
              {teachers.map((t) => (
                <li key={t._id} className="py-2 text-sm">
                  <div className="font-medium text-slate-800">{t.fullName}</div>
                  <div className="text-xs text-slate-500">{t.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Subjects ({subjects.length})</h2>
          {subjects.length === 0 ? <p className="text-sm text-slate-400">No subjects yet.</p> : (
            <ul className="divide-y">
              {subjects.map((s) => (
                <li key={s._id} className="py-2 text-sm flex justify-between">
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="text-xs font-mono text-slate-500">{s.code}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Parents ({parents.length})</h2>
          {parents.length === 0 ? <p className="text-sm text-slate-400">No parents yet.</p> : (
            <ul className="divide-y">
              {parents.map((p) => (
                <li key={p._id} className="py-2 text-sm">
                  <div className="font-medium text-slate-800">{p.fullName}</div>
                  <div className="text-xs text-slate-500">{p.email}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
