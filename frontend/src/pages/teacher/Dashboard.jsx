import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../../services/classApi";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the classes where this teacher is the Form Teacher
    classApi.myClasses()
      .then(({ data }) => setClasses(data.data.classes || []))
      .catch((err) => console.error("Failed to load classes", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-400">Loading your dashboard…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Welcome, {user?.fullName?.split(" ")[0] || "Teacher"}! 👋
      </h1>
      <p className="text-sm text-slate-500 mb-8">Here is your class for today.</p>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-500">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="font-semibold text-lg text-slate-700 mb-2">No Class Assigned Yet</h3>
          <p className="text-sm">You are not assigned as a Form Teacher to any class. Please contact the School Admin to assign you to a class.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <div key={cls._id} className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-blue-600">
              <h2 className="text-xl font-bold text-slate-800 mb-1">
                {cls.displayName || cls.name}
              </h2>
              <p className="text-sm text-slate-500 mb-6">{cls.academicSession} · {cls.level}</p>

              <div className="grid grid-cols-2 gap-3">
                <Link
  to={`/dashboard/attendance?classId=${cls._id}`}
  className="bg-blue-700 text-white text-center py-2 rounded-lg font-medium hover:bg-blue-800 transition"
>
  Take Attendance
</Link>
                <Link
                  to={`/dashboard/classes/${cls._id}`}
                  className="bg-slate-100 text-slate-700 text-center py-2 rounded-lg font-medium hover:bg-slate-200 transition"
                >
                  View Class
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
