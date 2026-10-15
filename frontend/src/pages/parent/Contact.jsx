import { useEffect, useState } from "react";
import { parentApi } from "../../services/parentApi";

export default function ParentContact() {
  const [form, setForm] = useState({
    subject: "", body: "", priority: "normal", addressedTo: "admin", studentId: "",
  });
  const [children, setChildren] = useState([]);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    const [d, m] = await Promise.all([parentApi.dashboard(), parentApi.messages()]);
    setChildren(d.data.data.children.map((c) => c.student));
    setMessages(m.data.data.messages);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await parentApi.contact(form);
      setMsg({ type: "success", text: "Message sent" });
      setForm({ subject: "", body: "", priority: "normal", addressedTo: "admin", studentId: "" });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed" });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Contact the School</h1>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>{msg.text}</div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-slate-600">Regarding (optional)</span>
            <select className="mt-1 w-full border rounded-lg p-2"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">General enquiry</option>
              {children.map((c) => (
                <option key={c._id} value={c._id}>{c.fullName} ({c.className})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">To</span>
            <select className="mt-1 w-full border rounded-lg p-2"
              value={form.addressedTo}
              onChange={(e) => setForm({ ...form, addressedTo: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="form_teacher">Form Teacher</option>
              <option value="head_teacher">Head Teacher</option>
              <option value="accounts">Accounts</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-slate-600">Subject *</span>
          <input className="mt-1 w-full border rounded-lg p-2"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            required />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Message *</span>
          <textarea className="mt-1 w-full border rounded-lg p-2" rows="4"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Priority</span>
          <select className="mt-1 w-full border rounded-lg p-2"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>
        <button type="submit" className="bg-blue-700 text-white px-5 py-2 rounded-lg">
          Send Message
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-slate-700 mb-3">My Messages</h3>
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m._id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm">{m.subject}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.status === "resolved" || m.status === "closed" ? "bg-green-100 text-green-700" :
                    m.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{m.status.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {new Date(m.createdAt).toLocaleDateString()} · to {m.addressedTo.replace("_", " ")}
                </p>
                <p className="text-sm text-slate-700 mb-2">{m.body}</p>
                {m.reply?.body && (
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-2 rounded text-sm">
                    <p className="text-xs text-blue-700 font-medium mb-1">
                      Reply from {m.reply.repliedBy?.fullName || "School"}:
                    </p>
                    <p>{m.reply.body}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
