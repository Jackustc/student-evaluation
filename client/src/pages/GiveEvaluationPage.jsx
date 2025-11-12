// client/src/pages/GiveEvaluationPage.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api";
import FloatingAIAssistant from "../components/FloatingAIAssistant";
import "../styles/GiveEvaluationPage.css";

export default function GiveEvaluationPage() {
  const { id } = useParams(); // courseId
  const location = useLocation();
  const preselectId = new URLSearchParams(location.search).get("student");

  const [course, setCourse] = useState(null); // ✅ 新增课程状态
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(preselectId || null);

  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  // ✅ toast 状态
  const [message, setMessage] = useState("");
  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  // ✅ 加载课程信息（包含 aiEnabled）
  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);
      } catch (err) {
        console.error("❌ Failed to load course:", err);
        showMessage("❌ Failed to load course.");
      }
    }
    fetchCourse();
  }, [id]);
  // console.log("Fetching course info for:", id);
  useEffect(() => {
    console.log("✅ course data:", course);
  }, [course]);

  // ✅ 加载学生名单
  useEffect(() => {
    async function loadRoster() {
      try {
        const res = await api.get(`/courses/${id}/roster`);
        setStudents(res.data);
      } catch (err) {
        console.error("❌ Failed to load roster:", err);
        showMessage("❌ Failed to load roster.");
      }
    }
    loadRoster();
  }, [id]);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const submitEvaluation = async () => {
    if (!selected) return showMessage("❌ Please select a student.");
    if (!comment.trim()) return showMessage("❌ Comment cannot be empty.");

    try {
      await api.post(`/courses/${id}/evaluations`, {
        evaluateeId: selected,
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

  // ✅ 当选中学生时自动打开 Floating AI Assistant
  useEffect(() => {
    if (selected) {
      const event = new CustomEvent("open-ai-assistant");
      window.dispatchEvent(event);
    }
  }, [selected]);

  return (
    <div className="give-eval-page">
      <h2>⭐ Give Evaluation (Course Level)</h2>
      <p className="hint">You can evaluate any student in this course.</p>

      {/* ✅ Toast 提示 */}
      {message && (
        <div
          className={`toast ${message.startsWith("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {/* 🔍 搜索框 */}
      <input
        type="text"
        className="search-input"
        placeholder="Search student..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 学生列表 */}
      <ul className="student-list">
        {filtered.map((s) => (
          <li
            key={s.id}
            className={`student-item ${
              Number(selected) === s.id ? "selected" : ""
            }`}
            onClick={() => setSelected(s.id)}
          >
            <span>{s.name}</span>
            <span className="email">({s.email})</span>
          </li>
        ))}
      </ul>

      {/* 打分表单 */}
      {selected && (
        <div className="form-section">
          <h3>
            Evaluate:{" "}
            <span className="highlight">
              {students.find((s) => s.id === Number(selected))?.name}
            </span>
          </h3>

          <label>Score (1–5):</label>
          <input
            type="number"
            min="1"
            max="5"
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />

          <label>Comment:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your feedback..."
          />

          {/* ✅ 匿名选项 */}
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
            <button
              className="cancel-btn"
              onClick={() => {
                setSelected(null);
                setComment("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ✅ 浮动 AI 助手（仅当课程允许且选择学生时显示） */}
      {course?.aiEnabled && (
        <FloatingAIAssistant
          evaluateeName={
            students.find((s) => s.id === Number(selected))?.name || "student"
          }
        />
      )}
    </div>
  );
}
