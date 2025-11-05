// client/src/pages/RequestEvaluationPage.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api";
import "../styles/RequestEvaluationPage.css";

export default function RequestEvaluationPage() {
  const { id } = useParams(); // courseId
  const location = useLocation();
  const preselectId = new URLSearchParams(location.search).get("student");

  const [students, setStudents] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRoster() {
      try {
        const res = await api.get(`/courses/${id}/roster`);
        setStudents(res.data);
      } catch (err) {
        console.error("❌ Failed to load roster:", err);
      }
    }
    loadRoster();
  }, [id]);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2000);
  };

  const sendRequest = async (studentId) => {
    try {
      setLoadingId(studentId);
      const res = await api.post(`/courses/${id}/request-student-evaluation`, {
        requestee_id: studentId,
      });
      if (res.data.message?.includes("already pending")) {
        showMessage("⚠️ Request already sent.");
      } else {
        showMessage("✅ Request sent!");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "Failed to send request.";
      showMessage(`❌ ${msg}`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="request-eval-page">
      <h2>📨 Request Evaluation</h2>
      <p className="hint">
        You can send a request for students to complete their evaluations.
      </p>

      {message && (
        <div
          className={`toast ${message.startsWith("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      <ul className="student-list">
        {students.map((s) => (
          <li key={s.id} className="student-item">
            <span>
              {s.name} <span className="email">({s.email})</span>
            </span>
            <button
              onClick={() => sendRequest(s.id)}
              disabled={loadingId === s.id}
            >
              {loadingId === s.id ? "Sending..." : "Request"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
