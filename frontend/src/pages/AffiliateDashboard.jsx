import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    // You'll need an API endpoint to fetch this data
    api.get("/affiliates/me").then(({ data }) => setData(data.data));
  }, []);

  const referralLink = `${window.location.origin}/register-school?ref=${user?.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert("Referral link copied!");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Affiliate Program</h1>
      <p className="text-sm text-slate-500 mb-6">Invite schools and earn 20% on their first payment.</p>

      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg mb-6">
        <p className="text-blue-200 font-semibold mb-1 uppercase tracking-wider text-xs">Your Total Earnings</p>
        <h2 className="text-4xl font-bold">₦{(data?.balance || 0).toLocaleString()}</h2>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-white/10 p-3 rounded-lg border border-white/20 flex items-center justify-between">
            <span className="font-mono text-sm truncate">{referralLink}</span>
            <button onClick={copyToClipboard} className="bg-amber-500 text-white px-3 py-1 rounded text-xs font-bold">Copy</button>
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-slate-700 mb-3">Schools You Referred</h3>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {!data?.referrals?.length ? (
          <p className="p-6 text-sm text-slate-400">No referrals yet. Share your link to get started!</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">School</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-right">Commission</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.referrals.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-3 font-medium">{r.schoolName}</td>
                  <td className="p-3 text-xs text-slate-500">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-3 text-right text-green-700 font-mono">₦{r.commission.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
