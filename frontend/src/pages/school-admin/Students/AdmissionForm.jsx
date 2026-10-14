//frontend/src/pages/school-admin/Students/AdmissionForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../../services/studentApi";

const CLASSES = [
  "Nursery 1", "Nursery 2", "Nursery 3",
  "Primary 1", "Primary 2", "Primary 3",
  "Primary 4", "Primary 5", "Primary 6",
];

export default function AdmissionForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "male",
    nationality: "Nigerian",
    stateOfOrigin: "",
    religion: "",
    className: "",
    academicSession: "2025/2026",
    guardian: {
      fullName: "", relationship: "father", phone: "",
      altPhone: "", email: "", address: "", occupation: "",
    },
    emergencyContact: { fullName: "", phone: "", relationship: "" },
    medicalInfo: { bloodGroup: "", allergies: "", conditions: "", notes: "" },
    previousSchool: { name: "", lastClass: "", reasonForLeaving: "", lastDate: "" },
  });

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

  const validateStep1 = () =>
    form.fullName && form.dateOfBirth && form.gender && form.className && form.academicSession;

  const validateStep2 = () =>
    form.guardian.fullName && form.guardian.phone && form.guardian.relationship;

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        // Strip empty objects
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
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Admit New Pupil</h1>
      <p className="text-sm text-slate-500 mb-6">Step {step} of 3</p>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {/* ── Step 1: Pupil Bio ─────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-700">Pupil Information</h2>
            <Field label="Full Name *" value={form.fullName} onChange={(v) => update("fullName", v)} />
            <Field label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Gender *" value={form.gender} onChange={(v) => update("gender", v)}
                options={[{ v: "male", l: "Male" }, { v: "female", l: "Female" }]} />
              <Select label="Class *" value={form.className} onChange={(v) => update("className", v)}
                options={CLASSES.map((c) => ({ v: c, l: c }))} placeholder="Select class" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Academic Session *" value={form.academicSession} onChange={(v) => update("academicSession", v)} />
              <Field label="State of Origin" value={form.stateOfOrigin} onChange={(v) => update("stateOfOrigin", v)} />
            </div>
          </div>
        )}

        {/* ── Step 2: Guardian ──────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-700">Parent / Guardian</h2>
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
            <h2 className="font-semibold text-slate-700">Emergency Contact</h2>
            <Field label="Contact Name" value={form.emergencyContact.fullName} onChange={(v) => update("emergencyContact.fullName", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" value={form.emergencyContact.phone} onChange={(v) => update("emergencyContact.phone", v)} />
              <Field label="Relationship" value={form.emergencyContact.relationship} onChange={(v) => update("emergencyContact.relationship", v)} />
            </div>

            <h2 className="font-semibold text-slate-700 pt-4">Medical</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Blood Group" value={form.medicalInfo.bloodGroup} onChange={(v) => update("medicalInfo.bloodGroup", v)} />
              <Field label="Allergies" value={form.medicalInfo.allergies} onChange={(v) => update("medicalInfo.allergies", v)} />
            </div>

            <h2 className="font-semibold text-slate-700 pt-4">Previous School (optional)</h2>
            <Field label="School Name" value={form.previousSchool.name} onChange={(v) => update("previousSchool.name", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Last Class" value={form.previousSchool.lastClass} onChange={(v) => update("previousSchool.lastClass", v)} />
              <Field label="Reason for Leaving" value={form.previousSchool.reasonForLeaving} onChange={(v) => update("previousSchool.reasonForLeaving", v)} />
            </div>
          </div>
        )}

        {/* ── Nav buttons ──────────────────────────────── */}
        <div className="flex justify-between mt-8">
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
            className="px-4 py-2 rounded-lg border disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !validateStep1()) return setError("Please fill required pupil fields");
                if (step === 2 && !validateStep2()) return setError("Please fill required guardian fields");
                setError("");
                setStep((s) => s + 1);
              }}
              className="bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={submit}
              className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
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
      <span className="text-sm text-slate-600">{label}</span>
      <input
        type={type}
        className="mt-1 w-full border rounded-lg p-2"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      <select
        className="mt-1 w-full border rounded-lg p-2"
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
