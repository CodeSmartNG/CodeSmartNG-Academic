import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../../services/studentApi";
import { classApi } from "../../../services/classApi"; // 👈 Import classApi
import ImageUpload from "../../../components/ImageUpload";
import { useAuth } from "../../../context/AuthContext";

export default function AdmissionForm() {
  const navigate = useNavigate();
  const { activeTrack } = useAuth();
  const isSecondary = activeTrack === "secondary";
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // 👈 SAS: Fetch actual classes instead of using a hardcoded list
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "male",
    nationality: "Nigerian",
    stateOfOrigin: "",
    religion: "",
    className: "",
    stream: "", 
    academicSession: "2025/2026",
    photoUrl: "",
    guardian: {
      fullName: "", relationship: "father", phone: "",
      altPhone: "", email: "", address: "", occupation: "",
    },
    emergencyContact: { fullName: "", phone: "", relationship: "" },
    medicalInfo: { bloodGroup: "", allergies: "", conditions: "", notes: "" },
    previousSchool: { name: "", lastClass: "", reasonForLeaving: "", lastDate: "" },
  });

  // 👈 Fetch the classes created by the admin (e.g. JSS 1A, JSS 1B)
  useEffect(() => {
    classApi.list({ track: activeTrack })
      .then(({ data }) => {
        setAvailableClasses(data.data.classes || []);
      })
      .catch((err) => console.error("Failed to load classes", err))
      .finally(() => setLoadingClasses(false));
  }, [activeTrack]);

  const update = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  // 👈 Check if the selected class is SSS (requires a stream)
  // Note: we check if it includes "SSS" since the name could be "SSS 1A" or "SSS 1 Science"
  const isSSS = isSecondary && form.className.includes("SSS");

  const validateStep1 = () =>
    form.fullName && form.dateOfBirth && form.gender && form.className && form.academicSession && (!isSSS || form.stream);

  const validateStep2 = () =>
    form.guardian.fullName && form.guardian.phone && form.guardian.relationship;

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        stream: isSSS ? form.stream : null,
        emergencyContact: form.emergencyContact.fullName ? form.emergencyContact : undefined,
        medicalInfo: form.medicalInfo.bloodGroup ? form.medicalInfo : undefined,
        previousSchool: form.previousSchool.name ? form.previousSchool : undefined,
      };
      const { data } = await studentApi.create(payload);
      navigate(`/dashboard/students/${data.data.student._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to admit pupil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">
        Admit New {isSecondary ? "Secondary" : "Nursery/Primary"} Pupil
      </h1>
      <p className="text-sm text-slate-500 mb-6">Step {step} of 3</p>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* ── Step 1: Pupil Bio ─────────────────────────── */}
        {step === 1 && (
          <>
            <div className="flex justify-center mb-8">
              <ImageUpload 
                currentImage={form.photoUrl} 
                onUploadSuccess={(url) => update("photoUrl", url)} 
              />
            </div>
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-700 border-b pb-2">Pupil Information</h2>
              <Field label="Full Name *" value={form.fullName} onChange={(v) => update("fullName", v)} />
              <Field label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} />
              
              <div className="grid grid-cols-2 gap-4">
                <Select label="Gender *" value={form.gender} onChange={(v) => update("gender", v)}
                  options={[{ v: "male", l: "Male" }, { v: "female", l: "Female" }]} />
                
                {/* 👈 SAS: Show actual classes fetched from DB */}
                <Select 
                  label="Class *" 
                  value={form.className} 
                  onChange={(v) => update("className", v)}
                  options={availableClasses.map((c) => ({ v: c.name, l: c.name }))} 
                  placeholder={loadingClasses ? "Loading classes..." : availableClasses.length === 0 ? "No classes created yet" : "Select class"} 
                />
              </div>

              {/* 👈 SAS: Stream selector for SSS students */}
              {isSSS && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <Select 
                    label="Stream *" 
                    value={form.stream} 
                    onChange={(v) => update("stream", v)}
                    options={[
                      { v: "science", l: "Science" },
                      { v: "arts", l: "Arts" },
                      { v: "commercial", l: "Commercial" },
                    ]} 
                    placeholder="Select stream (required for SSS)" 
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    SSS students must be assigned to a stream for subject allocation.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Academic Session *" value={form.academicSession} onChange={(v) => update("academicSession", v)} />
                <Field label="State of Origin" value={form.stateOfOrigin} onChange={(v) => update("stateOfOrigin", v)} />
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Guardian ──────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-700 border-b pb-2">Parent / Guardian</h2>
            <Field label="Guardian Full Name *" value={form.guardian.fullName} onChange={(v) => update("guardian.fullName", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Relationship *" value={form.guardian.relationship} onChange={(v) => update("guardian.relationship", v)}
                options={[
                  { v: "father", l: "Father" }, { v: "mother", l: "Mother" },
                  { v: "guardian", l: "Guardian" }, { v: "other", l: "Other" },
                ]} />
              <Field label="Phone *" value={form.guardian.phone} onChange={(v) => update("guardian.phone", v)} />
            </div>
            <Field label="Alt. Phone" value={form.guardian.altPhone} onChange={(v) => update("guardian.altPhone", v)} />
            <Field label="Email" type="email" value={form.guardian.email} onChange={(v) => update("guardian.email", v)} />
            <Field label="Address" value={form.guardian.address} onChange={(v) => update("guardian.address", v)} />
            <Field label="Occupation" value={form.guardian.occupation} onChange={(v) => update("guardian.occupation", v)} />
          </div>
        )}

        {/* ── Step 3: Optional details ──────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-700 border-b pb-2">Emergency Contact</h2>
            <Field label="Contact Name" value={form.emergencyContact.fullName} onChange={(v) => update("emergencyContact.fullName", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" value={form.emergencyContact.phone} onChange={(v) => update("emergencyContact.phone", v)} />
              <Field label="Relationship" value={form.emergencyContact.relationship} onChange={(v) => update("emergencyContact.relationship", v)} />
            </div>

            <h2 className="font-semibold text-slate-700 pt-4 border-b pb-2">Medical</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Blood Group" value={form.medicalInfo.bloodGroup} onChange={(v) => update("medicalInfo.bloodGroup", v)} />
              <Field label="Allergies" value={form.medicalInfo.allergies} onChange={(v) => update("medicalInfo.allergies", v)} />
            </div>

            <h2 className="font-semibold text-slate-700 pt-4 border-b pb-2">Previous School (optional)</h2>
            <Field label="School Name" value={form.previousSchool.name} onChange={(v) => update("previousSchool.name", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Last Class" value={form.previousSchool.lastClass} onChange={(v) => update("previousSchool.lastClass", v)} />
              <Field label="Reason for Leaving" value={form.previousSchool.reasonForLeaving} onChange={(v) => update("previousSchool.reasonForLeaving", v)} />
            </div>
          </div>
        )}

        {/* ── Nav buttons ──────────────────────────────── */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
            className="px-6 py-2 rounded-lg border hover:bg-slate-50 disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !validateStep1()) return setError("Please fill required pupil fields (and stream if SSS)");
                if (step === 2 && !validateStep2()) return setError("Please fill required guardian fields");
                setError("");
                setStep((s) => s + 1);
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg"
            >
              Next Step
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={submit}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? "Admitting…" : "Admit Pupil"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        type={type}
        className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <select
        className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}
