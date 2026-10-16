
export default function TeacherDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Teacher Dashboard
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Welcome! Use the sidebar to manage your classes, homework, and results.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="My Classes" color="blue" />
        <Card label="Homework Assigned" color="green" />
        <Card label="Pending Marking" color="amber" />
      </div>
    </div>
  );
}

function Card({ label, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className={`p-4 rounded-xl ${colors[color]}`}>
      <div className="text-2xl font-bold">—</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}
