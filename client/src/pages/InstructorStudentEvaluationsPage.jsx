import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import "./InstructorStudentEvaluationsPage.css";

export default function InstructorStudentEvaluationsPage() {
  const { courseId, studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const res = await api.get(
        `/courses/${courseId}/students/${studentId}/evaluation-history`,
      );
      setData(res.data);
    }
    fetchData();
  }, [courseId, studentId]);

  if (!data) return <p>Loading...</p>;

  const { student, given, received, requestsSent, requestsReceived } = data;

  return (
    <div className="page-container">
      {/* 🔙 Back */}
      <button onClick={() => navigate(-1)}>← Back</button>

      {/* 👤 Student Info */}
      <div className="card">
        <h2>{student.name}</h2>
        <p>{student.email}</p>
        <p>ID: {student.studentId}</p>
      </div>

      {/* ===================== */}
      {/* GIVEN */}
      {/* ===================== */}
      <div className="card">
        <div className="section-title">
          Given Feedback
          <span className={`count ${given.length > 0 ? "active" : ""}`}>
            {given.length}
          </span>
        </div>

        {given.length === 0 ? (
          <p className="empty">No feedback given</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>To</th>
                <th>Team</th>
                <th>Score</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {given.map((g) => (
                <tr key={g.id}>
                  <td>{g.evaluatee.name}</td>
                  <td>{g.Team.name}</td>
                  <td className="score">⭐ {g.score}</td>
                  <td>{g.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===================== */}
      {/* RECEIVED */}
      {/* ===================== */}
      <div className="card">
        <div className="section-title">
          Received Feedback
          <span className={`count ${received.length > 0 ? "active" : ""}`}>
            {received.length}
          </span>
        </div>

        {received.length === 0 ? (
          <p className="empty">No feedback received</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th>Team</th>
                <th>Score</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {received.map((r) => (
                <tr key={r.id}>
                  <td>{r.evaluator.name}</td>
                  <td>{r.Team.name}</td>
                  <td className="score">⭐ {r.score}</td>
                  <td>
                    {r.comment}
                    {r.anonymousToPeers && (
                      <span style={{ color: "#999", marginLeft: 8 }}>
                        (Anonymous)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===================== */}
      {/* REQUESTS SENT */}
      {/* ===================== */}
      <div className="card">
        <div className="section-title">
          Requests Sent
          <span className={`count ${requestsSent.length > 0 ? "active" : ""}`}>
            {requestsSent.length}
          </span>
        </div>

        {requestsSent.length === 0 ? (
          <p className="empty">No requests sent</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>To</th>
                <th>Team</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requestsSent.map((r) => (
                <tr key={r.id}>
                  <td>{r.Requestee.name}</td>
                  <td>{r.Team.name}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===================== */}
      {/* REQUESTS RECEIVED */}
      {/* ===================== */}
      <div className="card">
        <div className="section-title">
          Requests Received
          <span
            className={`count ${requestsReceived.length > 0 ? "active" : ""}`}
          >
            {requestsReceived.length}
          </span>
        </div>

        {requestsReceived.length === 0 ? (
          <p className="empty">No requests received</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th>Team</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requestsReceived.map((r) => (
                <tr key={r.id}>
                  <td>{r.Requester.name}</td>
                  <td>{r.Team.name}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
