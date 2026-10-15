import { useEffect, useState } from "react";
import { announcementApi } from "../../services/commsApi";

const CATEGORY_COLORS = {
  general: "bg-slate-100 text-slate-700",
  event: "bg-blue-100 text-blue-700",
  holiday: "bg-purple-100 text-purple-700",
  urgent: "bg-red-100 text-red-700",
  academic: "bg-green-100 text-green-700",
  fees: "bg-amber-100 text-amber-700",
};

export default function ParentAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true);
    announcementApi.list()
      .then(({ data }) => setItems(data.data.announcements))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markRead = async (id) => {
    await announcementApi.markRead(id);
    setItems((prev) =>
      prev.map((a) => (a._id === id ? { ...a, isRead: true } : a))
    );
  };

  const toggle = (a) => {
    const willExpand = expanded !== a._id;
    setExpanded(willExpand ? a._id : null);
    if (willExpand && !a.isRead) markRead(a._id);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Announcements</h1>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
          No announcements yet
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a._id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
                a.priority === "urgent"
                  ? "border-red-500"
                  : a.priority === "high"
                  ? "border-amber-500"
                  : "border-transparent"
              } ${!a.isRead ? "ring-1 ring-blue-100" : ""}`}
            >
              <button
                onClick={() => toggle(a)}
                className="w-full text-left p-5"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!a.isRead && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                    {a.isPinned && <i className="fas fa-thumbtack text-amber-500 text-xs" />}
                    <h3 className="font-semibold text-slate-800">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>
                      {a.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-sm text-slate-600 mt-1 ${expanded === a._id ? "" : "line-clamp-2"}`}>
                  {a.body}
                </p>
                <div className="text-xs text-slate-400 mt-2">
                  From {a.authorId?.fullName}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
