import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { assessmentApi, resultApi } from "../../../services/resultApi";
import { useAuth } from "../../../context/AuthContext"; // 👈 SAS

export default function EnterScores() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeTrack } = useAuth(); // 👈 SAS
  const isSecondary = activeTrack === "secondary";

  const [assessment, setAssessment] = useState(null);
  const [pupils, setPupils] = useState([]);
  const [scores, setScores] = useState({});
  const [hasSavedScores, setHasSavedScores] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    assessmentApi.list({}).then(({ data }) => {
      const a = data.data.assessments.find((x) => x._id === id);
      setAssessment(a);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!assessment) return;
    setLoading(true);
    const classId = assessment.classId?._id;
    
    api.get(`/classes/${classId}`).then(({ data }) => {
      let classPupils = data.data.pupils || [];

      // 👈 SAS: Filter pupils by subject stream for Secondary
      // If this assessment is for a stream-specific subject (Physics, Chemistry),
      // only show pupils in that stream. Core subjects show all pupils.
      if (isSecondary && assessment.subjectId?.streams?.length > 0) {
        const subjectStreams = assessment.subjectId.streams;
        classPupils = classPupils.filter((p) => 
          !p.stream || subjectStreams.includes(p.stream)
        );
      }

      setPupils(classPupils);
      
      api.get(`/results/assessment/${assessment._id}/scores`).then(({ data: scoreRes }) => {
        const savedScores = scoreRes.data.scores || {};
        setScores(savedScores);
        
        if (Object.keys(savedScores).length > 0) {
          setHasSavedScores(true);
        }
      }).catch(err => console.error("Failed to load scores", err));

    }).catch((err) => console.error(err))
      .finally(() => setLoading(false));
      
  }, [assessment, isSecondary]);

  const setScore = (studentId, value) => {
    if (hasSavedScores) return;
    setScores((prev) => ({ ...prev, [studentId]: value }));
  };

  const save = async () => {
    if (!assessment) return;
    setSaving(true);
    try {
      const payload = {
        scores: Object.entries(scores)
          .filter(([_, v]) => v !== "" && v !== null && v !== undefined)
          .map(([studentId, score]) => ({ studentId, score: Number(score) })),
      };
      const { data } = await resultApi.enterScores(assessment._id, payload.scores);
      setToast({ type: "success", message: data.message });
      setHasSavedScores(true);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (!assessment) return <div className="p-6 text-red-600">Assessment not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4">← Back</button>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{assessment.name}</h1>
          <p className="text-sm text-slate-500">
            {assessment.classId?.name} · {assessment.subjectId?.name} ·{" "}
            {assessment.session} · {assessment.term} · Max: {assessment.maxScore}
          </p>
          {/* 👈 SAS: Show stream info for secondary subjects */}
          {isSecondary && assessment.subjectId?.streams?.length > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              Limited to {assessment.subjectId.streams.join(", ")} stream pupils
            </p>
          )}
        </div>
        {hasSavedScores && (
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            Scores Locked
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Pupil</th>
              {/* 👈 SAS: Show Stream column for Secondary */}
              {isSecondary && <th className="p-3 text-left">Stream</th>}
              <th className="p-3 text-left w-40">Score (/{assessment.maxScore})</th>
            </tr>
          </thead>
          <tbody>
            {pupils.length === 0 ? (
              <tr><td colSpan={isSecondary ? 4 : 3} className="p-6 text-center text-slate-400">
                No pupils found for this assessment
              </td></tr>
            ) : pupils.map((p, idx) => (
              <tr key={p._id} className="border-t">
                <td className="p-3 text-slate-400 text-xs">{idx + 1}</td>
                <td className="p-3">
                  <div className="font-medium">{p.fullName}</div>
                  <div className="text-xs text-slate-400 font-mono">{p.admissionNumber}</div>
                </td>
                {isSecondary && (
                  <td className="p-3">
                    {p.stream ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        p.stream === "science" ? "bg-blue-100 text-blue-700" :
                        p.stream === "arts" ? "bg-purple-100 text-purple-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {p.stream}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                )}
                <td className="p-3">
                  <input
                    type="number"
                    min="0"
                    max={assessment.maxScore}
                    className={`border rounded-lg p-2 w-24 ${hasSavedScores ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                    value={scores[p._id] ?? ""}
                    onChange={(e) => setScore(p._id, e.target.value)}
                    disabled={hasSavedScores}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-0 mt-6 bg-white border-t px-4 py-3 flex justify-end shadow-lg">
        {hasSavedScores ? (
          <div className="text-sm text-slate-500 py-2">
            These scores have already been saved and cannot be edited.
          </div>
        ) : (
          <button onClick={save} disabled={saving}
            className="bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">
            {saving ? "Saving…" : "Save Scores"}
          </button>
        )}
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        } text-white`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
