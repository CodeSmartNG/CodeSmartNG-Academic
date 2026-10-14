import { useEffect, useState } from "react";
import { feeApi, formatNaira } from "../../services/feeApi";

export default function ParentFees() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    feeApi.children()
      .then(({ data }) => setChildren(data.data.children))
      .finally(() => setLoading(false));
  }, []);

  const downloadReceipt = async (paymentId, receiptNumber) => {
    const token = localStorage.getItem("csn_token");
    const res = await fetch(`/api/fees/payments/${paymentId}/receipt.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${receiptNumber.replace(/\//g, "-")}.pdf`;
    link.click();
  };

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">School Fees</h1>

      {children.length === 0 ? (
        <p className="text-slate-500">No children linked.</p>
      ) : (
        <div className="space-y-4">
          {children.map((c) => (
            <div key={c.student._id} className="bg-white rounded-xl shadow-sm">
              <button
                onClick={() => setExpanded(expanded === c.student._id ? null : c.student._id)}
                className="w-full flex justify-between items-center p-5 text-left"
              >
                <div>
                  <div className="font-semibold text-slate-800">{c.student.fullName}</div>
                  <div className="text-xs text-slate-500">{c.student.className}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold font-mono ${
                    c.summary.totalBalance > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {formatNaira(c.summary.totalBalance)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {c.summary.totalBalance > 0 ? "Outstanding" : "All paid"}
                  </div>
                </div>
              </button>

              {expanded === c.student._id && (
                <div className="border-t p-5 space-y-3">
                  {c.bills.length === 0 ? (
                    <p className="text-sm text-slate-400">No bills yet.</p>
                  ) : c.bills.map((b) => (
                    <div key={b._id} className="border rounded-lg p-3">
                      <div className="flex justify-between mb-2">
                        <div className="text-sm font-medium">
                          {b.session} · {b.term}
                        </div>
                        <div className="text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${
                            b.status === "paid" ? "bg-green-100 text-green-700" :
                            b.status === "partial" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 text-xs gap-2">
                        <div>
                          <div className="text-slate-400">Total</div>
                          <div className="font-mono">{formatNaira(b.totalKobo)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Paid</div>
                          <div className="font-mono text-green-700">{formatNaira(b.paidKobo)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Balance</div>
                          <div className="font-mono text-red-700">{formatNaira(b.balanceKobo)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
