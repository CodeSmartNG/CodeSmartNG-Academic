import { useEffect, useState } from "react";
import { homeworkApi } from "../../services/commsApi";

export default function ParentHomework() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeworkApi.list()
      .then(({ data }) => setItems(data.data.homework))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Homework</h1>

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
            return (
              <div key={h._id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">{h.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {h.classId?.name} · {h.subjectId?.name} · Due{" "}
                      {new Date(h.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  {isOverdue && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2">{h.description}</p>
                <p className="text-xs text-slate-400 mt-2">
                  By {h.teacherId?.fullName}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
