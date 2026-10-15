import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { homeworkApi } from "../../services/commsApi";

export default function PupilHomework() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [answer, setAnswer] = useState("");

  const load = () => {
    setLoading(true);
    homeworkApi.list()
      .then(({ data }) => setItems(data.data.homework))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openSubmit = (id) => {
    setOpenId(id);
    setAnswer("");
  };

  const submit = async (id) => {
    await homeworkApi.submit(id, { textResponse: answer });
    setOpenId(null);
    load();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Homework</h1>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
          No homework assigned yet
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((h) => {
            const isOverdue = new Date(h.dueDate) < new Date();
            const mySubmission = h.submissions?.[0];
            return (
              <div key={h._id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">{h.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {h.subjectId?.name} · Due {new Date(h.dueDate).toLocaleDateString()}
                      {isOverdue && (
                        <span className="ml-2 text-red-600 font-medium">Overdue</span>
                      )}
                    </p>
                  </div>
                  {mySubmission ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      mySubmission.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : mySubmission.status === "outstanding"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {mySubmission.status}
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Not submitted
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2">{h.description}</p>

                {!mySubmission && h.allowTextSubmission && (
                  <>
                    {openId === h._id ? (
                      <div className="mt-4">
                        <textarea
                          className="w-full border rounded-lg p-3 text-sm"
                          rows="4"
                          placeholder="Type your answer here…"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => submit(h._id)}
                            className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => setOpenId(null)}
                            className="border px-4 py-1.5 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openSubmit(h._id)}
                        className="mt-3 text-sm text-blue-700 hover:underline"
                      >
                        Submit Answer →
                      </button>
                    )}
                  </>
                )}

                {mySubmission?.teacherRemark && (
                  <div className="mt-3 bg-slate-50 border-l-4 border-blue-600 p-2 text-sm rounded">
                    <p className="text-xs text-slate-500 mb-1">Teacher's remark</p>
                    <p>{mySubmission.teacherRemark}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
