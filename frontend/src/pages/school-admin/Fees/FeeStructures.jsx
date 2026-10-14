import { useEffect, useState } from "react";
import { classApi } from "../../../services/classApi";
import { feeApi, formatNaira } from "../../../services/feeApi";

export default function FeeStructures() {
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    const [sRes, cRes] = await Promise.all([
      feeApi.listStructures({ includeInactive: true }),
      classApi.list(),
    ]);
    setStructures(sRes.data.data.feeStructures);
    setClasses(cRes.data.data.classes);
  };

  useEffect(() => { load(); }, []);

  const generate = async (feeStructureId) => {
    if (!confirm("Generate bills for all active pupils in this class?")) return;
    const { data } = await feeApi.generateBills(feeStructureId);
    alert(data.message);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fee Structures</h1>
          <p className="text-sm text-slate-500">What each class pays per term</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Fee Structure
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {structures.length === 0 ? (
          <p className="text-slate-400">No fee structures yet.</p>
        ) : structures.map((s) => (
          <div key={s._id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{s.classId?.name}</h3>
                <p className="text-xs text-slate-500">{s.session} · {s.term}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {s.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <ul className="text-sm divide-y mb-3">
              {s.items.map((i, idx) => (
                <li key={idx} className="py-1 flex justify-between">
                  <span>
                    {i.name}
                    {i.isOptional && <span className="text-xs text-slate-400 ml-1">(optional)</span>}
                  </span>
                  <span className="font-medium">{formatNaira(i.amountKobo)}</span>
                </li>
              ))}
              <li className="py-1 flex justify-between font-bold border-t-2">
                <span>Total</span>
                <span>{formatNaira(s.totalKobo)}</span>
              </li>
            </ul>

            <button
              onClick={() => generate(s._id)}
              className="w-full bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm"
            >
              Generate Bills
            </button>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateStructureModal
          classes={classes}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function CreateStructureModal({ classes, onClose, onCreated }) {
  const [form, setForm] = useState({
    classId: "",
    session: "2025/2026",
    term: "First Term",
    items: [
      { name: "Tuition", amount: 20000, isOptional: false },
      { name: "Books", amount: 5000, isOptional: false },
      { name: "Other Charges", amount: 5000, isOptional: false },
    ],
    notes: "",
  });
  const [error, setError] = useState("");

  const updateItem = (idx, patch) => {
    const next = [...form.items];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, items: next });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { name: "", amount: 0, isOptional: false }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const total = form.items
    .filter((i) => !i.isOptional)
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  const submit = async () => {
    try {
      await feeApi.createStructure(form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl my-8">
        <h3 className="font-bold text-lg mb-4">New Fee Structure</h3>
        {error && <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <label className="col-span-1">
            <span className="text-sm text-slate-600">Class</span>
            <select className="mt-1 w-full border rounded-lg p-2"
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">Select…</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm text-slate-600">Session</span>
            <input className="mt-1 w-full border rounded-lg p-2" value={form.session}
              onChange={(e) => setForm({ ...form, session: e.target.value })} />
          </label>
          <label>
            <span className="text-sm text-slate-600">Term</span>
            <select className="mt-1 w-full border rounded-lg p-2" value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}>
              <option>First Term</option><option>Second Term</option><option>Third Term</option>
            </select>
          </label>
        </div>

        <h4 className="font-semibold text-slate-700 mb-2 text-sm">Fee Items (Naira)</h4>
        <div className="space-y-2 mb-4">
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input className="flex-1 border rounded-lg p-2 text-sm" placeholder="Item name"
                value={item.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })} />
              <input type="number" className="w-32 border rounded-lg p-2 text-sm"
                value={item.amount}
                onChange={(e) => updateItem(idx, { amount: Number(e.target.value) })} />
              <label className="text-xs flex items-center gap-1">
                <input type="checkbox" checked={item.isOptional}
                  onChange={(e) => updateItem(idx, { isOptional: e.target.checked })} />
                Opt
              </label>
              <button onClick={() => removeItem(idx)} className="text-red-500 text-sm">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="text-blue-600 text-sm mb-4">+ Add Item</button>

        <div className="bg-slate-50 rounded-lg p-3 mb-4 flex justify-between font-bold">
          <span>Total (required items)</span>
          <span>₦{total.toLocaleString()}</span>
        </div>

        <label className="block mb-4">
          <span className="text-sm text-slate-600">Notes for parents (optional)</span>
          <textarea className="mt-1 w-full border rounded-lg p-2" rows="2"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={submit} disabled={!form.classId}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
