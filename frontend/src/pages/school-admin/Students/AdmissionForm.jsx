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
    setS
