import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { announcementApi } from "../../../services/commsApi";

export default function CreateAnnouncement() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "general",
    priority: "normal",
    audience: "all",
    isPinned: false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await announcementApi.create(form);
      navigate("/dashboard/announcements");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">New Announcement</h1>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <label className="block">
          <span className="text-sm text-slate-600">Title *</span>
          <input className="mt-1 w-full border rounded-lg p-2" required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>

        <label className="block">
          <span className="text-sm text-slate-600">Body *</span>
          <textarea className="mt-1 w-full border rounded-lg p-2" rows="6" required
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-slate-600">Category</span>
            <select className="mt-1 w-full border rounded-lg p-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="general">General</option>
              <option value="event">Event</option>
              <option value="holiday">Holiday</option>
              <option value="academic">Academic</option>
              <option value="fees">Fees</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Priority</span>
            <select className="mt-1 w-full border rounded-lg p-2"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-slate-600">Audience</span>
          <select className="mt-1 w-full border rounded-lg p-2"
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}>
            <option value="all">Everyone</option>
            <option value="parents">Parents only</option>
            <option value="pupils">Pupils only</option>
            <option value="teachers">Teachers only</option>
            <option value="nursery">Nursery</option>
            <option value="primary">Primary</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.isPinned}
            onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
          <span className="text-sm text-slate-600">Pin to top</span>
        </label>

        <button type="submit" disabled={saving}
          className="w-full bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50">
          {saving ? "Publishing…" : "Publish Announcement"}
        </button>
      </form>
    </div>
  );
}
