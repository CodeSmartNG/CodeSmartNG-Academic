import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // 👈 Added useNavigate
import { classApi } from "../../../services/classApi";
import { feeApi, formatNaira } from "../../../services/feeApi";
import { useAuth } from "../../../context/AuthContext";

export default function BillList() {
  const { activeTrack } = useAuth();
  const isSecondary = activeTrack === "secondary";
  const location = useLocation();
  const navigate = useNavigate(); // 👈 Initialize navigate

  const [classes, setClasses] = useState([]);
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    classId: "", status: "", session: "2025/2026", term: "First Term",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classApi.list({ track: activeTrack }).then(({ data }) => setClasses(data.data.classes));
    setFilters(f => ({ ...f, classId: "" }));
  }, [activeTrack]);

  const load = () => {
    setLoading(true);
    Promise.all([
      feeApi.listBills({ ...filters, track: activeTrack }),
      feeApi.stats(filters.session, filters.term, activeTrack),
    ]).then(([b, s]) => {
      setBills(b.data.data.bills);
      setStats(s.data.data);
    }).finally(() => setLoading(false));
  };
  
  useEffect(load, [filters, activeTrack]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 👈 Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b pb-2">
        <Link 
          to="/dashboard/fees" 
          className={`font-semibold pb-2 ${location.pathname === "/dashboard/fees" ? "text-blue-700 border-b-2 border-blue-700" : "text-slate-500 hover:text-slate-700"}`}
        >
          Bills & Balances
        </Link>
        <Link 
          to="/dashboard/fees/structures" 
          className={`font-semibold pb-2 ${location.pathname === "/dashboard/fees/structures" ? "text-blue-700 border-b-2 border-blue-700" : "text-slate-500 hover:text-slate-700"}`}
        >
          Fee Structures
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {isSecondary ? "Secondary" : "Primary"} Bills & Balances
        </h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total Billed" value={formatNaira(stats.totalBilled)} color="blue" />
          <StatCard label="Total Collected" value={formatNaira(stats.totalPaid)} color="green" />
          <StatCard label="Outstanding" value={formatNaira(stats.totalBalance)} color="red" />
          <StatCard label="Pupils Owing" value={stats.unpaidCount + stats.partialCount} color="amber" />
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <select className="border rounded-lg p-2" value={filters.classId}
          onChange={(e) => setFilters({ ...filters, classId: e.target.value })}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="border rounded-lg p-2" value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <input className="border rounded-lg p-2" value={filters.session}
          onChange={(e) => setFilters({ ...filters, session: e.target.value })} />
        <select className="border rounded-lg p-2" value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
          <option>First Term</option><option>Second Term</option><option>Third Term</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Pupil</th>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Paid</th>
              <th className="p-3 text-right">Balance</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-400">Loading…</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-slate-400">
                No bills yet. Go to <strong>Fee Structures</strong> and click "Generate Bills".
              </td></tr>
            ) : bills.map((b) => (
              // 👈 SAS: Made the entire row clickable
              <tr 
                key={b._id} 
                className="border-t hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/dashboard/fees/bills/${b._id}`)}
              >
                <td className="p-3">
                  <div className="font-medium text-blue-700">{b.studentId?.fullName}</div>
                  <div className="text-xs text-slate-400 font-mono">{b.studentId?.admissionNumber}</div>
                </td>
                <td className="p-3 text-xs">
                  {b.classId?.name}
                  {b.studentId?.stream && (
                    <span className="ml-1 text-[10px] text-blue-600 capitalize">
                      ({b.studentId.stream})
                    </span>
                  )}
                </td>
                <td className="p-3 text-right font-mono">{formatNaira(b.totalKobo)}</td>
                <td className="p-3 text-right font-mono text-green-700">{formatNaira(b.paidKobo)}</td>
                <td className="p-3 text-right font-mono text-red-700">{formatNaira(b.balanceKobo)}</td>
                <td className="p-3">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="text-xl font-bold">{value}</div>
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
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
