import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { homeworkApi } from "../../../services/commsApi";

export default function HomeworkList() {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeworkApi.list()
      .then(({ data }) => setHomework(data.data.homework))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Homework</h1>
          <p className="text-sm text-slate-500">Assignments you've published</p>
        </div>
        <Link to="/dashboard/homework/new"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg">
          + Assign Homework
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : homework.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
          No homework yet
        </div>
      ) : (
        <div className="space-y-3">
          {homework.map((h) => {
            const isOverdue = new Date(h.dueDate) < new Date();
            return (
              <Link
                key={h._id}
                to={`/dashboard/homework/${h._id}`}
                className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">{h.title}</h3>
                    <p className="text-xs text-slate-500 mb-2">
                      {h.classId?.name} · {h.subjectId?.name} · Due{" "}
                      {new Date(h.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2">{h.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-blue-700">
                      {h.stats?.submitted || 0}/{h.stats?.total || 0}
                    </div>
                    <div className="text-xs text-slate-500">submitted</div>
                    {isOverdue && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
