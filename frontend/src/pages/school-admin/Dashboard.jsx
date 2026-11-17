import { useEffect, useState, useRef } from "react"; // 👈 Added useRef
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function SchoolAdminDashboard() {
  const { activeTrack } = useAuth();
  const isSecondary = activeTrack === "secondary";
  const [searchParams, setSearchParams] = useSearchParams();

  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [parents, setParents] = useState([]);
  
  const [pupilStats, setPupilStats] = useState(null);

  const [teacherForm, setTeacherForm] = useState({ fullName: "", email: "", password: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "" });
  const [parentForm, setParentForm] = useState({ fullName: "", email: "", password: "" });
  
  const [bankForm, setBankForm] = useState({ bankName: "", accountName: "", accountNumber: "" });
  const [bankMsg, setBankMsg] = useState(null);
  const [msg, setMsg] = useState(null);

  // 👈 Logo Upload States
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMsg, setLogoMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null); // Hidden file input reference

  const [schoolData, setSchoolData] = useState(null);
  const [paying, setPaying] = useState(false);

  const loadData = () => {
    api.get("/users?role=teacher").then(({ data }) => setTeachers(data.data.users || [])).catch(console.error);
    api.get("/subjects", { params: { track: activeTrack } }).then(({ data }) => setSubjects(data.data.subjects || [])).catch(console.error);
    api.get("/users?role=parent").then(({ data }) => setParents(data.data.users || [])).catch(console.error);
    api.get("/students/stats", { params: { track: activeTrack } }).then(({ data }) => setPupilStats(data.data)).catch(console.error);
    
    api.get("/schools/mine").then(({ data }) => {
      const school = data.data.school;
      setSchoolData(school);
      if (school?.settings?.bankDetails) setBankForm(school.settings.bankDetails);
      setLogoUrl(school?.logoUrl || "");
    }).catch((err) => console.error("Failed to load school:", err));
  };

  useEffect(() => {
    loadData();

    const reference = searchParams.get("reference");
    const paymentStatus = searchParams.get("payment");

    if (paymentStatus === "success" && reference) {
      api.get(`/subscriptions/verify/${reference}`)
        .then(({ data }) => {
          if (data.success) {
            alert("Payment successful! Your subscription has been renewed.");
            loadData();
            setSearchParams({});
          }
        })
        .catch((err) => console.error("Verification failed", err));
    }
  }, [searchParams, setSearchParams, activeTrack]);

  // 👈 Handle Logo Upload (Direct from clicking the logo)
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Basic size check
    if (file.size > 5 * 1024 * 1024) {
      return alert("Image is too large. Please choose an image under 5MB.");
    }

    setUploading(true);
    setLogoMsg({ type: "success", text: "Uploading logo..." });

    const formData = new FormData();
    formData.append("file", file);
    
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary setup missing.");
      setUploading(false);
      return;
    }
    formData.append("upload_preset", uploadPreset);

    try {
      // 1. Upload to Cloudinary
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.secure_url) {
        // 2. Save URL to MongoDB
        setLogoUrl(data.secure_url);
        await api.patch("/schools/mine", { logoUrl: data.secure_url });
        setLogoMsg({ type: "success", text: "Logo updated successfully!" });
        setTimeout(() => setLogoMsg(null), 3000);
      } else {
        alert(`Upload failed: ${data.error?.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image.");
    } finally {
      setUploading(false);
    }
  };

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

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/subjects", { ...subjectForm, track: activeTrack });
      setMsg({ type: "success", text: `${isSecondary ? "Secondary" : "Primary"} subject added!` });
      setSubjectForm({ name: "", code: "" });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add subject" });
    }
  };

  const handleAddParent = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post("/users", { ...parentForm, role: "parent" });
      setMsg({ type: "success", text: "Parent added!" });
      setParentForm({ fullName: "", email: "", password: "" });
      loadData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to add parent" });
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    setBankMsg(null);
    try {
      await api.patch("/schools/mine", { settings: { bankDetails: bankForm } });
      setBankMsg({ type: "success", text: "Bank details saved!" });
      loadData();
    } catch (err) {
      setBankMsg({ type: "error", text: err.response?.data?.message || "Failed to save bank details" });
    }
  };

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

  const isExpiring = () => {
    if (!schoolData?.subscriptionExpiresAt) return false;
    const expiry = new Date(schoolData.subscriptionExpiresAt);
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return expiry < threeDaysFromNow;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      
      {/* 👈 FANTASTIC UI: HERO BANNER WITH CLICKABLE LOGO */}
      <div className="relative bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 md:p-8 mb-8 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-blue-400 opacity-20 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleLogoUpload} 
          />

          {/* Clickable Logo Container */}
          <div 
            className="relative group cursor-pointer" 
            onClick={() => fileInputRef.current.click()}
            title="Click to change logo"
          >
            <div className="w-28 h-28 bg-white rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white/20 transition-transform duration-300 group-hover:scale-105 relative">
              {logoUrl ? (
                <img src={logoUrl} alt="School Logo" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-school text-4xl text-slate-300"></i>
              )}

              {/* Uploading Overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
                </div>
              )}
            </div>

            {/* Small Camera Icon Overlay */}
            <div className="absolute -bottom-3 -right-3 bg-amber-500 hover:bg-amber-400 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white">
              <i className="fas fa-camera text-sm"></i>
            </div>
          </div>

          {/* School Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">{schoolData?.name || "Loading..."}</h1>
            <p className="text-blue-200 text-sm mb-4">{schoolData?.address || "No address set"}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm ${
                isSecondary ? "bg-blue-500 text-white" : "bg-green-500 text-white"
              }`}>
                {isSecondary ? "SECONDARY SECTION" : "PRIMARY SECTION"}
              </span>
              <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                {schoolData?.slug}
              </span>
            </div>
            
            {logoMsg && (
              <p className={`text-xs mt-3 font-medium ${logoMsg.type === "success" ? "text-green-300" : "text-red-300"}`}>
                {logoMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* 👈 END HERO BANNER */}

      {pupilStats?.trackSplit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {(pupilStats.trackSplit.primary > 0 || !isSecondary) && (
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Primary Pupils</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{pupilStats.trackSplit.primary}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <i className="fas fa-child text-xl"></i>
              </div>
            </div>
          )}

          {(pupilStats.trackSplit.secondary > 0 || isSecondary) && (
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Secondary Pupils</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{pupilStats.trackSplit.secondary}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <i className="fas fa-book-reader text-xl"></i>
              </div>
            </div>
          )}
        </div>
      )}

      {isExpiring() && (
        <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded-xl mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
          <div>
            <h3 className="font-bold text-red-800 text-lg flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i> Subscription Expiring!
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Your subscription expired or will expire on <strong>{new Date(schoolData.subscriptionExpiresAt).toLocaleDateString()}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleUpgrade("starter")} disabled={paying} className="bg-white border border-red-600 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100">Starter ₦5,000</button>
            <button onClick={() => handleUpgrade("standard")} disabled={paying} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">Standard ₦10,000</button>
            <button onClick={() => handleUpgrade("premium")} disabled={paying} className="bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-900">Premium ₦20,000</button>
          </div>
        </div>
      )}

      {msg && (
        <div className={`p-3 rounded-lg mb-6 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Add Teacher */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a New Teacher</h2>
          <form onSubmit={handleAddTeacher} className="space-y-4">
            <input required placeholder="Full Name" className="w-full border rounded-lg p-2" value={teacherForm.fullName} onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })} />
            <input required type="email" placeholder="Email" className="w-full border rounded-lg p-2" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} />
            <input required type="text" placeholder="Temp Password" className="w-full border rounded-lg p-2" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} />
            <button type="submit" className="w-full bg-blue-700 text-white px-4 py-2 rounded-lg">+ Create Teacher</button>
          </form>
        </div>

        {/* Add Subject */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a {isSecondary ? "Secondary" : "Primary"} Subject</h2>
          <form onSubmit={handleAddSubject} className="space-y-4">
            <input required placeholder={isSecondary ? "e.g. Physics" : "e.g. Mathematics"} className="w-full border rounded-lg p-2" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} />
            <input placeholder="Code (optional)" className="w-full border rounded-lg p-2" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} />
            <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-lg">+ Create Subject</button>
          </form>
        </div>

        {/* Add Parent */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Add a New Parent</h2>
          <form onSubmit={handleAddParent} className="space-y-4">
            <input required placeholder="Full Name" className="w-full border rounded-lg p-2" value={parentForm.fullName} onChange={(e) => setParentForm({ ...parentForm, fullName: e.target.value })} />
            <input required type="email" placeholder="Email" className="w-full border rounded-lg p-2" value={parentForm.email} onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })} />
            <input required type="text" placeholder="Temp Password" className="w-full border rounded-lg p-2" value={parentForm.password} onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })} />
            <button type="submit" className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg">+ Create Parent</button>
          </form>
        </div>
      </div>

      {/* School Bank Account */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6 mb-8">
        <h2 className="font-semibold text-slate-700 mb-4">School Bank Account (for Fees)</h2>
        {bankMsg && <div className={`p-3 rounded mb-3 text-sm ${bankMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{bankMsg.text}</div>}
        <form onSubmit={handleSaveBank} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input required placeholder="Bank Name" className="border rounded-lg p-2" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
          <input required placeholder="Account Name" className="border rounded-lg p-2" value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} />
          <input required placeholder="Account Number" className="border rounded-lg p-2" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
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
          <h2 className="font-semibold text-slate-700 mb-4">{isSecondary ? "Secondary" : "Primary"} Subjects ({subjects.length})</h2>
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
