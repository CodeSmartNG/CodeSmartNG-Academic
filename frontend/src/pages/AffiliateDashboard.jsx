import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function AffiliateDashboard() {
  const { user, loading: authLoading } = useAuth(); // 👈 Get authLoading
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // Wait for user to load
    api.get("/affiliates/me")
      .then(({ data }) => setData(data.data))
      .catch((err) => console.error("Failed to load affiliate data:", err))
      .finally(() => setLoading(false));
  }, [user]);

  // 1. Wait for both Auth and API to finish loading
  if (authLoading || loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
        <p>Loading affiliate data...</p>
      </div>
    );
  }

  // 2. Only build the link if the code exists
  const code = data?.referralCode || user?.referralCode;
  const referralLink = code ? `${window.location.origin}/register-school?ref=${code}` : "";

  const copyToClipboard = () => {
    if (!referralLink) return alert("Referral code is still generating. Please refresh.");
    navigator.clipboard.writeText(referralLink);
    alert("✅ Referral link copied! Share it on WhatsApp to earn.");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Affiliate Program</h1>
        <p className="text-sm text-slate-500">
          Invite schools and earn <strong className="text-blue-700">20% commission</strong> on their first payment.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        
        <p className="text-blue-200 font-semibold mb-1 uppercase tracking-wider text-xs">Your Total Earnings</p>
        <h2 className="text-5xl font-bold mb-6">
          ₦{(data?.balance || 0).toLocaleString()}
        </h2>
        
        {/* 3. Only show the link input if code exists */}
        <div className="bg-white/10 p-2 rounded-xl border border-white/20 flex items-center justify-between gap-2 backdrop-blur-sm">
          <div className="pl-3 truncate">
            <span className="font-mono text-sm text-blue-100">
              {referralLink || "Generating your unique link..."}
            </span>
          </div>
          <button 
            onClick={copyToClipboard} 
            disabled={!referralLink}
            className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors disabled:opacity-50"
          >
            <i className="fas fa-copy mr-2"></i> Copy Link
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-slate-700 mb-3">Schools You Referred</h3>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {!data?.referrals?.length ? (
          <div className="p-10 text-center text-slate-500">
            <div className="text-4xl mb-3">📢</div>
            <p className="text-sm">No referrals yet.</p>
            <p className="text-xs text-slate-400 mt-1">Share your link on WhatsApp to get started!</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">School</th>
                <th className="p-3 text-left">Date Joined</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Commission</th>
              </tr>
            </thead>
            <tbody>
              {data.referrals.map((r) => {
                const earning = data.earnings?.find(e => e.schoolId === r._id);
                return (
                  <tr key={r._id} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{r.schoolName}</td>
                    <td className="p-3 text-xs text-slate-500">
                      {new Date(r.date).toLocaleDateString("en-NG", { 
                        day: "numeric", month: "short", year: "numeric" 
                      })}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "approved" ? "bg-green-100 text-green-700" : 
                        r.status === "pending" ? "bg-amber-100 text-amber-700" : 
                        "bg-red-100 text-red-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {earning ? (
                        <span className="text-green-700 font-bold">₦{earning.amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Pending payment</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
