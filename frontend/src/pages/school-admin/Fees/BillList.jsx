import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../../../services/classApi";
import { feeApi, formatNaira } from "../../../services/feeApi";

export default function BillList() {
  const [classes, setClasses] = useState([]);
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    classId: "", status: "", session: "2025/2026", term: "First Term",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classApi.list().then(({ data }) => setClasses(data.data.classes));
  }, []);

  const load = () => {
    setLoading(true);
    Promise.all([
      feeApi.listBills(filters),
      feeApi.stats(filters.session, filters.term),
    ]).then(([b, s]) => {
      setBills(b.data.data.bills);
      setStats(s.data.data);
    }).finally(() => setLoading(false));
  };
  useEffect(load, [filters]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Bills & Balances</h1>

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
              <th className="p-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">Loading…</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan="7" className="p-6 text-center text-slate-400">
                No bills yet. Create a fee structure and click Generate Bills.
              </td></tr>
            ) : bills.map((b) => (
              <tr key={b._id} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{b.studentId?.fullName}</div>
                  <div className="text-xs text-slate-400 font-mono">{b.studentId?.admissionNumber}</div>
                </td>
                <td className="p-3 text-xs">{b.classId?.name}</td>
                <td className="p-3 text-right font-mono">{formatNaira(b.totalKobo)}</td>
                <td className="p-3 text-right font-mono text-green-700">{formatNaira(b.paidKobo)}</td>
                <td className="p-3 text-right font-mono text-red-700">{formatNaira(b.balanceKobo)}</td>
                <td className="p-3">
                  <StatusBadge status={b.status} />
                </td>
                <td className="p-3 text-right">
                  <Link to={`/dashboard/fees/bills/${b._id}`} className="text-blue-600 hover:underline text-xs">
                    View
                  </Link>
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
