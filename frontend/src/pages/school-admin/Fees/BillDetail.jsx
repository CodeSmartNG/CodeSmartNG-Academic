import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { feeApi, formatNaira } from "../../../services/feeApi";

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await feeApi.getBill(id);
      setBill(data.data.bill);
      setPayments(data.data.payments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const voidPayment = async (paymentId) => {
    const reason = prompt("Reason for voiding this payment?");
    if (reason === null) return;
    await feeApi.voidPayment(paymentId, reason);
    load();
  };

  const downloadReceipt = async (paymentId, receiptNumber) => {
    const token = localStorage.getItem("csn_token");
    const url = feeApi.receiptPdfUrl(paymentId);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${receiptNumber.replace(/\//g, "-")}.pdf`;
    link.click();
  };

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (!bill) return <div className="p-6 text-red-600">Bill not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4">← Back</button>

      {/* Pupil card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{bill.studentId?.fullName}</h1>
            <p className="text-sm text-slate-500">
              {bill.studentId?.admissionNumber} · {bill.classId?.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">{bill.session} · {bill.term}</p>
          </div>
          <StatusBadge status={bill.status} />
        </div>

        {/* Money summary */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <Stat label="Total" value={formatNaira(bill.totalKobo)} color="slate" />
          <Stat label="Paid" value={formatNaira(bill.paidKobo)} color="green" />
          <Stat label="Balance" value={formatNaira(bill.balanceKobo)} color="red" />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setShowPay(true)}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* Bill items */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
        <h3 className="font-semibold text-slate-700 mb-3">Fee Breakdown</h3>
        <ul className="text-sm divide-y">
          {bill.items.map((i, idx) => (
            <li key={idx} className="py-2 flex justify-between">
              <span>
                {i.name}
                {i.isOptional && <span className="text-xs text-slate-400 ml-1">(optional)</span>}
              </span>
              <span className="font-mono">{formatNaira(i.amountKobo)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-slate-700 mb-3">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-400">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs">
              <tr>
                <th className="p-2 text-left">Receipt</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Method</th>
                <th className="p-2 text-right">Amount</th>
                <th className="p-2 text-left">Recorded By</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-2 font-mono text-xs">{p.receiptNumber}</td>
                  <td className="p-2 text-xs">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="p-2 text-xs capitalize">{p.method.replace("_", " ")}</td>
                  <td className="p-2 text-right font-mono text-green-700">
                    {formatNaira(p.amountKobo)}
                  </td>
                  <td className="p-2 text-xs">{p.recordedBy?.fullName}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => downloadReceipt(p._id, p.receiptNumber)}
                      className="text-blue-600 hover:underline text-xs mr-2"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => voidPayment(p._id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Void
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPay && (
        <RecordPaymentModal
          bill={bill}
          onClose={() => setShowPay(false)}
          onRecorded={() => { setShowPay(false); load(); }}
        />
      )}

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

function RecordPaymentModal({ bill, onClose, onRecorded }) {
  const [form, setForm] = useState({
    amount: (bill.balanceKobo / 100).toFixed(2),
    method: "cash",
    reference: "",
    bankName: "",
    transactionId: "",
    payerName: "",
    payerPhone: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true); setError("");
    try {
      await feeApi.recordPayment({ ...form, billId: bill._id });
      onRecorded();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg my-8">
        <h3 className="font-bold text-lg mb-4">Record Payment</h3>
        {error && <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label>
            <span className="text-sm text-slate-600">Amount (₦) *</span>
            <input type="number" step="0.01" className="mt-1 w-full border rounded-lg p-2"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          <label>
            <span className="text-sm text-slate-600">Method *</span>
            <select className="mt-1 w-full border rounded-lg p-2" value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="pos">POS</option>
              <option value="online">Online</option>
            </select>
          </label>
        </div>

        {["bank_transfer", "cheque", "pos"].includes(form.method) && (
          <>
            <label className="block mb-3">
              <span className="text-sm text-slate-600">Reference / Teller No.</span>
              <input className="mt-1 w-full border rounded-lg p-2"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-sm text-slate-600">Bank Name</span>
              <input className="mt-1 w-full border rounded-lg p-2"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            </label>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label>
            <span className="text-sm text-slate-600">Payer Name</span>
            <input className="mt-1 w-full border rounded-lg p-2"
              value={form.payerName}
              onChange={(e) => setForm({ ...form, payerName: e.target.value })} />
          </label>
          <label>
            <span className="text-sm text-slate-600">Payer Phone</span>
            <input className="mt-1 w-full border rounded-lg p-2"
              value={form.payerPhone}
              onChange={(e) => setForm({ ...form, payerPhone: e.target.value })} />
          </label>
        </div>

        <label className="block mb-4">
          <span className="text-sm text-slate-600">Notes</span>
          <textarea className="mt-1 w-full border rounded-lg p-2" rows="2"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={submit} disabled={saving || !form.amount}
            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
            {saving ? "Saving…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colors = {
    slate: "bg-slate-50 text-slate-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={`p-3 rounded-xl ${colors[color]}`}>
      <div className="text-lg font-bold font-mono">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    paid: "bg-green-100 text-green-700",
    partial: "bg-amber-100 text-amber-700",
    unpaid: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
