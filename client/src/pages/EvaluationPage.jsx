import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import api from "../api";
import { useAuthStore } from "../store/auth";
import FloatingAIAssistant from "../components/FloatingAIAssistant";
import "../styles/EvaluationPage.css";

export default function EvaluationPage() {
  const { id } = useParams(); // teamId

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam) setTab(tabParam); // ✅ 根据 URL 设置初始 tab
  }, [location.search]);

  // const navigate = useNavigate();
  const { user } = useAuthStore();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);

  // 表单状态
  const [evaluateeId, setEvaluateeId] = useState("");
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [message, setMessage] = useState("");

  // 评价数据状态
  const [tab, setTab] = useState("give");
  const [received, setReceived] = useState([]);
  const [given, setGiven] = useState([]);
  const [allEvals, setAllEvals] = useState([]);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await api.get(`/teams/${id}`);
        setTeam(res.data);
        setMembers(res.data.TeamMemberships.map((m) => m.User));
        // setMembers(
        //   res.data.AllMembers || res.data.TeamMemberships.map((m) => m.User)
        // );
      } catch (err) {
        console.error("Failed to fetch team:", err);
      }
    }
    fetchTeam();
  }, [id]);

  // 通用 toast
  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  // 提交评价
  const submitEvaluation = async () => {
    if (!evaluateeId) return showMessage("❌ Please choose a teammate.");
    if (!comment.trim()) return showMessage("❌ Comment cannot be empty.");
    try {
      await api.post(`/teams/${id}/evaluations`, {
        evaluateeId,
        score,
        comment,
        anonymousToPeers: anonymous,
      });
      showMessage("✅ Evaluation submitted!");
      setComment("");
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to submit evaluation.");
    }
  };

  // 根据 tab 加载不同数据
  useEffect(() => {
    if (tab === "received") {
      api
        .get(`/teams/${id}/evaluations/me`)
        .then((res) => setReceived(res.data));
    } else if (tab === "given") {
      api
        .get(`/teams/${id}/evaluations/given`)
        .then((res) => setGiven(res.data));
    } else if (tab === "all") {
      api
        .get(`/teams/${id}/evaluations/all`)
        .then((res) => setAllEvals(res.data));
    }
  }, [tab, id]);

  if (!team) return <p>Loading...</p>;

  return (
    <div className="evaluation-page">
      {/* <button className="back-btn" onClick={() => navigate(`/teams/${id}`)}>
        ← Back to Team
      </button> */}

      <h2>Peer Evaluation — {team.name}</h2>
      <p className="hint">You can evaluate your teammates anonymously.</p>

      {/* Toast */}
      {message && (
        <div
          className={`toast ${message.startsWith("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {/* ====== Tabs ====== */}
      <div className="tabs">
        <button
          className={tab === "give" ? "active" : ""}
          onClick={() => setTab("give")}
        >
          ⭐ Give Evaluation
        </button>
        <button
          className={tab === "received" ? "active" : ""}
          onClick={() => setTab("received")}
        >
          📥 My Received
        </button>
        <button
          className={tab === "given" ? "active" : ""}
          onClick={() => setTab("given")}
        >
          📤 My Given
        </button>
        <button
          className={tab === "all" ? "active" : ""}
          onClick={() => setTab("all")}
        >
          📋 All in Team
        </button>
      </div>

      {/* ====== Give Evaluation ====== */}
      {tab === "give" && (
        <div className="form-section">
          <label>Choose Teammate:</label>
          <select
            value={evaluateeId}
            onChange={(e) => setEvaluateeId(e.target.value)}
          >
            <option value="">-- select --</option>
            {members
              .filter((m) => m.id !== user?.id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>

          <label>Score (1–5):</label>
          <input
            type="number"
            min="1"
            max="5"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />

          <label>Comment:</label>
          <p className="hint">
            You may write your feedback from these aspects: role, contributions,
            collaboration, strengths, improvements.
          </p>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your feedback..."
          />

          <label className="anon-toggle">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            Submit anonymously
          </label>

          <div className="buttons">
            <button className="submit-btn" onClick={submitEvaluation}>
              Submit Evaluation
            </button>
          </div>
        </div>
      )}

      {/* ====== My Received ====== */}
      {tab === "received" && (
        <div className="eval-list">
          <h3>Feedback You Received</h3>
          {received.length === 0 ? (
            <p>No feedback yet.</p>
          ) : (
            received.map((r) => (
              <div key={r.id} className="eval-card">
                <div className="eval-meta">
                  <div className="meta-left">
                    <strong>
                      {r.evaluatorName || `Anon-${r.evaluatorId}`}
                    </strong>{" "}
                    — ⭐ {r.score}
                  </div>
                  <div className="meta-right">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <p>{r.comment}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ====== My Given ====== */}
      {tab === "given" && (
        <div className="eval-list">
          <h3>Evaluations You Gave</h3>
          {given.length === 0 ? (
            <p>No evaluations yet.</p>
          ) : (
            given.map((g) => (
              <div key={g.id} className="eval-card">
                <div className="eval-meta">
                  <div className="meta-left">
                    To <strong>{g.evaluateeName}</strong> — ⭐ {g.score}
                  </div>
                  <div className="meta-right">
                    {new Date(g.createdAt).toLocaleString()}
                  </div>
                </div>
                <p>{g.comment}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ====== All in Team ====== */}
      {tab === "all" && (
        <div className="eval-list">
          <h3>All Evaluations in Team</h3>
          {allEvals.length === 0 ? (
            <p>No evaluations yet.</p>
          ) : (
            <table className="eval-table">
              <thead>
                <tr>
                  <th>Giver</th>
                  <th>Receiver</th>
                  <th>Score</th>
                  <th>Comment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allEvals.map((e) => (
                  <tr key={e.id}>
                    <td>{e.evaluatorName}</td>
                    <td>{e.evaluateeName}</td>
                    <td>{e.score}</td>
                    <td>{e.comment}</td>
                    <td>{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ✅ 悬浮式 AI 助手 */}
      <FloatingAIAssistant
        evaluateeName={
          members.find((m) => m.id === Number(evaluateeId))?.name || "teammate"
        }
      />
    </div>
  );
}
