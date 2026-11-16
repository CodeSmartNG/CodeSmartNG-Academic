import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom"; // 👈 Added useLocation
import { classApi } from "../../../services/classApi";
import { subjectApi } from "../../../services/classApi";
import { assessmentApi } from "../../../services/resultApi";
import { useAuth } from "../../../context/AuthContext";

export default function AssessmentList() {
  const { activeTrack } = useAuth();
  const isSecondary = activeTrack === "secondary";
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Init useLocation

  const [searchParams, setSearchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [filters, setFilters] = useState({
    classId: searchParams.get("classId") || "",
    subjectId: searchParams.get("subjectId") || "",
    session: searchParams.get("session") || "2025/2026",
    term: searchParams.get("term") || "First Term",
  });

  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    Promise.all([
      classApi.list({ track: activeTrack }),
      subjectApi.list({ track: activeTrack }),
    ]).then(([c, s]) => {
      setClasses(c.data.data.classes);
      setSubjects(s.data.data.subjects);
    });
  }, [activeTrack]);

  const load = () => {
    assessmentApi.list({ ...filters, track: activeTrack }).then(({ data }) => setAssessments(data.data.assessments));
    setSearchParams(filters, { replace: true });
  };

  useEffect(load, [filters, activeTrack]);

  const remove = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this assessment and its scores?")) return;
    await assessmentApi.remove(id);
    load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      
      {/* 👈 SAS: ADDED TABS HERE */}
      <div className="flex gap-6 border-b border-slate-200 mb-6">
        <Link 
          to="/dashboard/results" 
          className={`pb-2 font-medium ${location.pathname === "/dashboard/results" ? "text-blue-700 border-b-2 border-blue-700" : "text-slate-500 hover:text-slate-700"}`}
        >
          Assessments
        </Link>
        <Link 
          to="/dashboard/results/broadsheet" 
          className={`pb-2 font-medium ${location.pathname === "/dashboard/results/broadsheet" ? "text-blue-700 border-b-2 border-blue-700" : "text-slate-500 hover:text-slate-700"}`}
        >
          Broadsheet & Publish
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isSecondary ? "Secondary Assessments" : "Nursery & Primary Assessments"}
          </h1>
          <p className="text-sm text-slate-500">Create tests & exams, then enter scores</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + New Assessment
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <select className="border rounded-lg p-2" value={filters.classId}
          onChange={(e) => setFilters({ ...filters, classId: e.target.value })}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="border rounded-lg p-2" value={filters.subjectId}
          onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}>
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <input className="border rounded-lg p-2" placeholder="Session"
          value={filters.session}
          onChange={(e) => setFilters({ ...filters, session: e.target.value })} />
        <select className="border rounded-lg p-2" value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}>
          <option>First Term</option>
          <option>Second Term</option>
          <option>Third Term</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left whitespace-nowrap">Name</th>
                <th className="p-3 text-left whitespace-nowrap">Class</th>
                <th className="p-3 text-left whitespace-nowrap">Subject</th>
                <th className="p-3 text-left whitespace-nowrap">Type</th>
                <th className="p-3 text-left whitespace-nowrap">Max</th>
                <th className="p-3 text-left whitespace-nowrap">Teacher</th>
                <th className="p-3 text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.length === 0 ? (
                <tr><td colSpan="7" className="p-6 text-center text-slate-400">No assessments yet</td></tr>
              ) : assessments.map((a) => (
                <tr 
                  key={a._id} 
                  className="border-t hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/dashboard/results/scores/${a._id}`)}
                >
                  <td className="p-3 font-medium text-blue-700 whitespace-nowrap">{a.name}</td>
                  <td className="p-3 whitespace-nowrap">{a.classId?.name}</td>
                  <td className="p-3 whitespace-nowrap">{a.subjectId?.name}</td>
                  <td className="p-3 capitalize text-xs whitespace-nowrap">{a.type}</td>
                  <td className="p-3 whitespace-nowrap">{a.maxScore}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{a.teacherId?.fullName}</td>
                  <td className="p-3 flex gap-2 whitespace-nowrap">
                    <span className="text-blue-600 text-xs font-semibold">
                      Enter Scores →
                    </span>
                    <button onClick={(e) => remove(e, a._id)} className="text-red-600 hover:underline text-xs ml-2">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateAssessmentModal
          classes={classes}
          subjects={subjects}
          defaults={{ session: filters.session, term: filters.term }}
          isSecondary={isSecondary}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

// ... Keep your CreateAssessmentModal function exactly as it is ...
