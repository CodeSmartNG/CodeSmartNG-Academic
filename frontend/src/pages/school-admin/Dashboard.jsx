
export default function SchoolAdminDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        School Admin Dashboard
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Welcome to CodeSmartNG Academic — use the sidebar to manage your school.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Active Pupils" color="blue" />
        <Card label="Classes" color="green" />
        <Card label="Present Today" color="amber" />
        <Card label="Outstanding Fees" color="red" />
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-2">Getting started</h2>
        <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
          <li>Admit pupils from the <strong>Pupils</strong> menu</li>
          <li>Create classes and assign teachers under <strong>Classes</strong></li>
          <li>Record daily attendance, results and fees</li>
          <li>Publish announcements for parents</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ label, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="text-2xl font-bold">—</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}
