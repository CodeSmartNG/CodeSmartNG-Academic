import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { announcementApi } from "../../../services/commsApi";

const CATEGORY_COLORS = {
  general: "bg-slate-100 text-slate-700",
  event: "bg-blue-100 text-blue-700",
  holiday: "bg-purple-100 text-purple-700",
  urgent: "bg-red-100 text-red-700",
  academic: "bg-green-100 text-green-700",
  fees: "bg-amber-100 text-amber-700",
};

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    announcementApi.list()
      .then(({ data }) => setAnnouncements(data.data.announcements))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    await announcementApi.remove(id);
    setAnnouncements((prev) => prev.filter((a) => a._id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Announcements</h1>
          <p className="text-sm text-slate-500">Posts visible to parents, pupils, teachers</p>
        </div>
        <Link to="/dashboard/announcements/new"
          className="bg-blue-700 text-white px-4 py-2 rounded-lg">
          + New Announcement
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
          No announcements yet
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a._id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {a.isPinned && <i className="fas fa-thumbtack text-amber-500 text-xs" />}
                  <h3 className="font-semibold text-slate-800">{a.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}>
                    {a.category}
                  </span>
                  {a.priority === "urgent" && (
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleDateString()}
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 mb-3">{a.body}</p>
              <div className="flex justify-between items-center text-xs">
                <div className="text-slate-500">
                  <i className="fas fa-users mr-1" />
                  Audience: <span className="capitalize">{a.audience}</span>
                  {a.targetClassIds?.length > 0 && (
                    <span className="ml-2">· {a.targetClassIds.length} class(es)</span>
                  )}
                  <span className="ml-3">
                    <i className="fas fa-eye mr-1" />
                    {a.readBy?.length || 0} read
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/dashboard/announcements/${a._id}`}
                    className="text-blue-600 hover:underline">Edit</Link>
                  <button onClick={() => remove(a._id)}
                    className="text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
