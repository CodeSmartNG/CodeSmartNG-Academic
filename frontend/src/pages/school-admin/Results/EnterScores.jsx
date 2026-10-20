import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { assessmentApi, resultApi } from "../../../services/resultApi";

export default function EnterScores() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [pupils, setPupils] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Load the specific assessment
    assessmentApi.list({}).then(({ data }) => {
      const a = data.data.assessments.find((x) => x._id === id);
      setAssessment(a);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  // Once assessment is known, load its pupils + existing scores
  useEffect(() => {
    if (!assessment) return;
    setLoading(true);
    const classId = assessment.classId?._id;
    
    // 1. Fetch pupils in the class
    api.get(`/classes/${classId}`).then(({ data }) => {
      const pupils = data.data.pupils || [];
      setPupils(pupils);
      
      // 2. Fetch the EXACT saved scores for this assessment
      api.get(`/results/assessment/${assessment._id}/scores`).then(({ data: scoreRes }) => {
        setScores(scoreRes.data.scores || {});
      }).catch(err => console.error("Failed to load scores", err));

    }).catch((err) => console.error(err))
      .finally(() => setLoading(false));
      
  }, [assessment]);

  const setScore = (studentId, value) => {
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

      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <h1 className="text-xl font-bold text-slate-800">{assessment.name}</h1>
        <p className="text-sm text-slate-500">
          {assessment.classId?.name} · {assessment.subjectId?.name} ·{" "}
          {assessment.session} · {assessment.term} · Max: {assessment.maxScore}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Pupil</th>
              <th className="p-3 text-left w-40">Score (/{assessment.maxScore})</th>
            </tr>
          </thead>
          <tbody>
            {pupils.length === 0 ? (
              <tr><td colSpan="3" className="p-6 text-center text-slate-400">No pupils</td></tr>
            ) : pupils.map((p, idx) => (
              <tr key={p._id} className="border-t">
                <td className="p-3 text-slate-400 text-xs">{idx + 1}</td>
                <td className="p-3">
                  <div className="font-medium">{p.fullName}</div>
                  <div className="text-xs text-slate-400 font-mono">{p.admissionNumber}</div>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    min="0"
                    max={assessment.maxScore}
                    className="border rounded-lg p-2 w-24"
                    value={scores[p._id] ?? ""}
                    onChange={(e) => setScore(p._id, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-0 mt-6 bg-white border-t px-4 py-3 flex justify-end shadow-lg">
        <button onClick={save} disabled={saving}
          className="bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">
          {saving ? "Saving…" : "Save Scores"}
        </button>
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
