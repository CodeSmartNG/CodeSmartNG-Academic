import { useEffect, useState } from "react";
import { feeApi, formatNaira } from "../../services/feeApi";

export default function ParentFees() {
  const [children, setChildren] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    feeApi.children()
      .then(({ data }) => {
        setChildren(data.data.children || []);
        setBankDetails(data.data.bankDetails || null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">School Fees</h1>

      {/* 👇 Bank Details Card */}
      {bankDetails?.accountNumber ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">💳 School Bank Account</h2>
          <p className="text-sm text-blue-800 mb-2">
            Transfer fees to this account and show the receipt to the school to approve your payment.
          </p>
          <div className="bg-white rounded-lg p-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-slate-500 uppercase">Bank</div>
              <div className="font-semibold">{bankDetails.bankName}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Account Name</div>
              <div className="font-semibold">{bankDetails.accountName}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Account Number</div>
              <div className="font-mono font-bold text-blue-700">{bankDetails.accountNumber}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          ⏳ The school has not set up their bank details yet. Please contact the school directly.
        </div>
      )}

      {/* Children Fee Cards */}
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
