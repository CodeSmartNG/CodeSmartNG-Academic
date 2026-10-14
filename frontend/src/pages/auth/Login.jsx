import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", schoolSlug: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password, form.schoolSlug || undefined);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">CodeSmartNG Academic</h1>
        <p className="text-sm text-slate-500">Smart School Management, Better Learning.</p>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          className="w-full border rounded-lg p-3"
          placeholder="School slug (optional for super admin)"
          value={form.schoolSlug}
          onChange={(e) => setForm({ ...form, schoolSlug: e.target.value })}
        />
        <input
          className="w-full border rounded-lg p-3"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="w-full border rounded-lg p-3"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button className="w-full bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-lg font-medium">
          Sign in
        </button>
      </form>
    </div>
  );
}
