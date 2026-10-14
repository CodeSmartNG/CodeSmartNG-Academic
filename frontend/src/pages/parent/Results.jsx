import { useEffect, useState } from "react";
import { resultApi } from "../../services/resultApi";
import api from "../../services/api";

export default function ParentResults() {
  const [children, setChildren] = useState([]);
  const [filters, setFilters] = useState({ session: "2025/2026", term: "First Term" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resultApi.children(filters.session, filters.term)
      .then(({ data }) => setChildren(data.data.children))
      .finally(() => setLoading(false));
  }, [filters]);

  const download = async (studentId) => {
    const token = localStorage.getItem("csn_token");
    const url = `/api/results/pupil/${studentId}/pdf?session=${encodeURIComponent(filters.session)}&term=${encodeURIComponent(filters.term)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObject
