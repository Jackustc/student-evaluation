import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import "../styles/CoursePage.css";
import { useAuthStore } from "../store/auth";

export default function CoursePage() {
  const { id } = useParams(); // courseId
  const [course, setCourse] = useState(null);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");

  // 新增状态：给老师评分与评论
  const [instructorScore, setInstructorScore] = useState("");
  const [instructorComment, setInstructorComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showEvalForm, setShowEvalForm] = useState(false);

  const { user } = useAuthStore();

  // 获取课程信息 & 小组
  useEffect(() => {
    async function fetchCourse() {
      try {
        // 先拿课程信息（含 title）
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data);

        // 再拿课程下所有团队
        const teamRes = await api.get(`/courses/${id}/teams`);
        // setCourse({ id });
        setTeams(teamRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCourse();
  }, [id]);

  // 创建新小组
  const createTeam = async () => {
    if (!newTeamName) return;
    try {
      const res = await api.post(`/courses/${id}/teams`, { name: newTeamName });
      setTeams([...teams, res.data]);
      setNewTeamName("");
    } catch (err) {
      console.error(err);
    }
  };

  const joinTeam = async (teamId) => {
    try {
      await api.post(`/teams/${teamId}/members`);
      alert("Joined the team!");
      // ✅ 更新前端状态（把自己加到 TeamMemberships）
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? {
                ...t,
                TeamMemberships: [
                  ...(t.TeamMemberships || []),
                  { userId: user?.id, User: user },
                ],
              }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to join team");
    }
  };

  const leaveTeam = async (teamId) => {
    const confirmLeave = window.confirm(
      "Are you sure you want to leave this team?\nYou will lose access to team evaluations and discussions."
    );

    if (!confirmLeave) return; // 用户点击取消，直接中断

    try {
      await api.delete(`/teams/${teamId}/members`);
      alert("✅ You have left the team.");
      // 更新前端视图
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? {
                ...t,
                TeamMemberships: t.TeamMemberships.filter(
                  (m) => m.userId !== user?.id
                ),
              }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      alert("❌ Failed to leave team.");
    }
  };

  // ✅ 提交学生对老师的评价
  const submitInstructorEvaluation = async () => {
    if (!instructorScore || !instructorComment) {
      alert("Please provide both score and comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/courses/${id}/evaluations`, {
        evaluateeId: course.instructor.id,
        score: Number(instructorScore),
        comment: instructorComment,
        anonymousToPeers: false,
      });
      alert("✅ Evaluation submitted successfully!");
      setInstructorScore("");
      setInstructorComment("");
    } catch (err) {
      console.error("❌ Failed to submit evaluation:", err);
      alert("Failed to submit evaluation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ 学生请求老师评价自己
  const requestInstructorEvaluation = async () => {
    if (!course?.instructor?.id) return alert("Instructor not found.");
    setIsSubmitting(true);
    try {
      await api.post(`/courses/${id}/request-instructor-evaluation`);
      alert("✅ Request sent to instructor!");
    } catch (err) {
      console.error("❌ Failed to send request:", err);
      alert("Failed to send request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="course-container">
      <h2 className="course-title">{course?.title || "Course"}</h2>

      <div className="teams-section">
        <h3 className="section-title">Teams</h3>
        {teams.length === 0 ? (
          <p className="empty-msg">No teams created yet.</p>
        ) : (
          <ul className="team-list">
            {teams.map((t) => {
              const isMember = t.TeamMemberships?.some(
                (m) => m.userId === user?.id
              );

              return (
                <li key={t.id} className="team-item">
                  <span>{t.name}</span>
                  <div>
                    <Link to={`/teams/${t.id}`}>
                      <button className="team-btn">Go to Team</button>
                    </Link>

                    {isMember ? (
                      <button
                        className="leave-btn"
                        onClick={() => leaveTeam(t.id)}
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        className="join-btn"
                        onClick={() => joinTeam(t.id)}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="create-team">
        <h3 className="section-title">Create New Team</h3>
        <input
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="Team name"
        />
        <button onClick={createTeam} className="create-btn">
          Create
        </button>
      </div>

      {/* 🧩 Instructor Evaluation Section */}
      {course?.instructor && (
        <div className="create-team instructor-eval-section">
          <h3 className="section-title">
            Instructor Evaluation – {course.instructor.name}
          </h3>

          <div className="eval-buttons">
            <button
              className="team-btn"
              onClick={() => setShowEvalForm((prev) => !prev)}
            >
              ⭐ Go to Evaluation
            </button>

            <button
              onClick={requestInstructorEvaluation}
              className="join-btn"
              disabled={isSubmitting}
            >
              📨 Request Evaluation
            </button>
          </div>

          {showEvalForm && (
            <div className="eval-form">
              <label>Score (1–5):</label>
              <input
                type="number"
                min="1"
                max="5"
                value={instructorScore}
                onChange={(e) => setInstructorScore(e.target.value)}
                className="score-input"
              />

              <label>Comment:</label>
              <textarea
                value={instructorComment}
                onChange={(e) => setInstructorComment(e.target.value)}
                placeholder="Write your feedback for the instructor..."
                className="comment-textarea"
              />

              <button
                onClick={submitInstructorEvaluation}
                className="create-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Evaluation"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
