
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-blue-700 mb-4">404</div>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">
          Page not found
        </h1>
        <Link
          to="/dashboard"
          className="bg-blue-700 text-white px-5 py-2 rounded-lg inline-block"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
