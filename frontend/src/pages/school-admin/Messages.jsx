import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/parent/admin/messages")
      .then(({ data }) => setMessages(data.data.messages || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const submitReply = async (id) => {
    try {
      await api.patch(`/parent/admin/messages/${id}/reply`, { replyBody });
      setReplyId(null);
      setReplyBody("");
      setError(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reply");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Parent Messages</h1>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
          No messages from parents yet.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m._id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-slate-800">{m.subject}</div>
                  <div className="text-xs text-slate-500">
                    From <strong>{m.parentId?.fullName}</strong> · {m.parentId?.phone}
                    {m.studentId && (
                      <> · Regarding <strong>{m.studentId.fullName}</strong></>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  m.status === "resolved" ? "bg-green-100 text-green-700" :
                  m.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {m.status.replace("_", " ")}
                </span>
              </div>

              <p className="text-sm text-slate-700 mb-3">{m.body}</p>

              {m.reply?.body ? (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded text-sm">
                  <div className="text-xs font-semibold text-blue-700 mb-1">
                    Your Reply ({m.reply.repliedBy?.fullName}):
                  </div>
                  <p>{m.reply.body}</p>
                </div>
              ) : replyId === m._id ? (
                <div className="mt-3 border-t pt-3">
                  {error && <div className="bg-red-50 text-red-700 p-2 rounded mb-2 text-xs">{error}</div>}
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm"
                    rows="3"
                    placeholder="Type your reply..."
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setReplyId(null)} className="px-3 py-1.5 border rounded-lg text-sm">
                      Cancel
                    </button>
                    <button onClick={() => submitReply(m._id)} className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm">
                      Send Reply
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setReplyId(m._id); setReplyBody(""); }}
                  className="text-sm text-blue-700 hover:underline"
                >
                  Reply to this message →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
