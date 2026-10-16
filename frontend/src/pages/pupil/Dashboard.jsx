
export default function PupilDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Pupil Dashboard
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Welcome! Check your homework, results, and school announcements.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="My Homework" color="blue" />
        <Card label="My Results" color="green" />
        <Card label="Announcements" color="amber" />
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
