
//frontend/src/pages/school-admin/Students/StudentDetail.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { studentApi } from "../../../services/studentApi";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferData, setTransferData] = useState({ toSchool: "", reason: "" });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await studentApi.get(id);
      setStudent(data.data.student);
    } catch {
      navigate("/dashboard/students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleArchive = async () => {
    if (!confirm("Archive this pupil? They will be hidden from active lists.")) return;
    await studentApi.archive(id);
    load();
  };

  const handleRestore = async () => {
    await studentApi.restore(id);
    load();
  };

  const handleTransfer = async () => {
    if (!transferData.toSchool) return alert("Destination school required");
    await studentApi.transfer(id, transferData);
    setShowTransfer(false);
    load();
  };

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (!student) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4">
        ← Back to list
      </button>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl text-slate-400">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              student.fullName.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">{student.fullName}</h1>
            <p className="text-slate-500 font-mono text-sm">{student.admissionNumber}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{student.className}</span>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full capitalize">{student.gender}</span>
              {student.age != null && <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full">{student.age} yrs</span>}
              <StatusBadge status={student.admissionStatus} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 flex-wrap">
          {student.admissionStatus === "active" && (
            <>
              <button
                onClick={() => setShowTransfer(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Transfer Out
              </button>
              <button
                onClick={handleArchive}
                className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Archive
              </button>
            </>
          )}
          {student.admissionStatus === "archived" && (
            <button
              onClick={handleRestore}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Restore
            </button>
          )}
        </div>
      </div>

      {/* Info sections */}
      <div className="grid md:grid-cols-2 gap-4">
        <InfoCard title="Guardian">
          <Row label="Name" value={student.guardian?.fullName} />
          <Row label="Relationship" value={student.guardian?.relationship} />
          <Row label="Phone" value={student.guardian?.phone} />
          <Row label="Email" value={student.guardian?.email} />
          <Row label="Address" value={student.guardian?.address} />
        </InfoCard>

        <InfoCard title="Academic">
          <Row label="Class" value={student.className} />
          <Row label="Session" value={student.academicSession} />
          <Row label="Admitted" value={new Date(student.admissionDate).toLocaleDateString()} />
          <Row label="Status" value={student.admissionStatus} />
        </InfoCard>

        {student.emergencyContact?.fullName && (
          <InfoCard title="Emergency Contact">
            <Row label="Name" value={student.emergencyContact.fullName} />
            <Row label="Phone" value={student.emergencyContact.phone} />
            <Row label="Relationship" value={student.emergencyContact.relationship} />
          </InfoCard>
        )}

        {student.medicalInfo?.bloodGroup && (
          <InfoCard title="Medical">
            <Row label="Blood Group" value={student.medicalInfo.bloodGroup} />
            <Row label="Allergies" value={student.medicalInfo.allergies} />
            <Row label="Conditions" value={student.medicalInfo.conditions} />
          </InfoCard>
        )}

        {student.previousSchool?.name && (
          <InfoCard title="Previous School">
            <Row label="School" value={student.previousSchool.name} />
            <Row label="Last Class" value={student.previousSchool.lastClass} />
            <Row label="Reason" value={student.previousSchool.reasonForLeaving} />
          </InfoCard>
        )}

        {student.promotionHistory?.length > 0 && (
          <InfoCard title="Promotion History">
            {student.promotionHistory.map((p, i) => (
              <Row
                key={i}
                label={new Date(p.promotedAt).toLocaleDateString()}
                value={`${p.fromClass} → ${p.toClass} (${p.fromSession} → ${p.toSession})`}
              />
            ))}
          </InfoCard>
        )}
      </div>

      {/* Transfer modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Transfer Pupil</h3>
            <label className="block mb-3">
              <span className="text-sm text-slate-600">Destination School *</span>
              <input
                className="mt-1 w-full border rounded-lg p-2"
                value={transferData.toSchool}
                onChange={(e) => setTransferData({ ...transferData, toSchool: e.target.value })}
              />
            </label>
            <label className="block mb-4">
              <span className="text-sm text-slate-600">Reason</span>
              <textarea
                className="mt-1 w-full border rounded-lg p-2"
                rows="3"
                value={transferData.reason}
                onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
              />
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowTransfer(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button onClick={handleTransfer} className="bg-amber-600 text-white px-4 py-2 rounded-lg">
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-semibold text-slate-700 mb-3 border-b pb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right ml-4">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-green-100 text-green-700",
    promoted: "bg-blue-100 text-blue-700",
    transferred: "bg-amber-100 text-amber-700",
    graduated: "bg-purple-100 text-purple-700",
    archived: "bg-slate-200 text-slate-600",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
      {status}
    </span>
  );
}
