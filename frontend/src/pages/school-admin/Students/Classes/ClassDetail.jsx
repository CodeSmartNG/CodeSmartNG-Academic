import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { classApi, subjectApi } from "../../../services/classApi";
import api from "../../../services/api";

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [pupils, setPupils] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
 
