import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import "../styles/InstructorCoursePage.css";

export default function InstructorCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [roster, setRoster] = useState([]);
  const [teams, setTeams] = useState([]);
  const [joinToken, setJoinToken] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loadingAI, setLoadingAI] = useState(false);

  const [description, setDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);

  const [editingBasic, setEditingBasic] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCode, setEditCode] = useState("");

  const [message, setMessage] = useState("");
  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const resCourses = await api.get("/courses/mine");
        const found = resCourses.data.find((c) => c.id === Number(id));
        setCourse(found);
        setDescription(found?.description || "");
        setJoinToken(found?.joinToken);

        const [resRoster, resTeams] = await Promise.all([
          api.get(`/courses/${id}/roster`),
          api.get(`/courses/${id}/teams`),
        ]);
        setRoster(resRoster.data);
        setTeams(resTeams.data);
      } catch (err) {
        console.error("Failed to load course:", err);
        showMessage("Failed to load course data. Please check login status.");
      }
    }
    fetchData();
  }, [id]);

  const saveDescription = async () => {
    try {
      await api.patch(`/courses/${id}/description`, { description });
      showMessage("✅ Description updated!");
      setEditingDesc(false);
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to update description");
    }
  };

  const saveBasicInfo = async () => {
    try {
      const res = await api.patch(`/courses/${id}/basic`, {
        title: editTitle,
        code: editCode,
      });

      setCourse(res.data.course);
      showMessage("✅ Course info updated!");
      setEditingBasic(false);
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to update course info");
    }
  };

  const generateWithAI = async () => {
    try {
      setLoadingAI(true);
      const res = await api.post("/ai/generate", {
        type: "course-description",
        payload: { title: course.title },
      });
      setDescription(res.data.content);
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to generate with AI");
    } finally {
      setLoadingAI(false);
    }
  };

  const rotateToken = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/courses/${id}/join-token/rotate`);
      setJoinToken(res.data.joinToken);
      showMessage("✅ Join Token refreshed!");
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to refresh token");
    } finally {
      setLoading(false);
    }
  };

  const toggleQR = async () => {
    if (showQR) {
      setShowQR(false);
      return;
    }
    try {
      const res = await api.get(`/courses/${id}/join-qr`);
      setQrUrl(res.data.qrDataUrl);
      setShowQR(true);
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to get QR code");
    }
  };

  if (!course) return <p>Loading...</p>;

  return (
    <div className="instructor-course-page">
      {/* ✅ Toast 提示 */}
      {message && (
        <div
          className={`toast ${message.startsWith("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {/* --- Basic Info Section (Title + Code) --- */}
      <section className="card-section">
        <div className="section-header">
          <h3>Basic Info</h3>

          {!editingBasic ? (
            <button
              className="btn-edit"
              onClick={() => {
                setEditingBasic(true);
                setEditTitle(course.title);
                setEditCode(course.code);
              }}
            >
              Edit
            </button>
          ) : (
            <div className="desc-buttons">
              <button className="btn-save" onClick={saveBasicInfo}>
                Save
              </button>
              <button
                className="btn-cancel"
                onClick={() => setEditingBasic(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editingBasic ? (
          <>
            <h2 className="page-title">{course.title}</h2>
            <p className="course-meta">Course Code: {course.code}</p>
          </>
        ) : (
          <div className="edit-basic-form">
            <label>
              Title:
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>

            <label>
              Code:
              <input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      {/* --- AI Assistant Section --- */}
      <section className="card-section">
        <div className="section-header">
          <h3>AI Assistant</h3>
        </div>

        <p>
          Status:{" "}
          <strong style={{ color: course.aiEnabled ? "green" : "gray" }}>
            {course.aiEnabled ? "Enabled ✅" : "Disabled ❌"}
          </strong>
        </p>

        {/* <label>
          <input
            type="checkbox"
            checked={course.aiEnabled}
            onChange={async (e) => {
              try {
                const newValue = e.target.checked;
                await api.patch(`/courses/${id}/ai-enabled`, {
                  aiEnabled: newValue,
                });
                setCourse({ ...course, aiEnabled: newValue });
                showMessage(
                  `AI Assistant ${newValue ? "enabled" : "disabled"}!`
                );
              } catch (err) {
                console.error(err);
                showMessage("❌ Failed to update AI Assistant setting");
              }
            }}
          />{" "}
          Enable AI Assistant for this course
        </label> */}
      </section>

      {/* --- Description Section --- */}
      <section className="card-section">
        <div className="section-header">
          <h3>Course Description</h3>

          {!editingDesc ? (
            <button className="btn-edit" onClick={() => setEditingDesc(true)}>
              Edit
            </button>
          ) : (
            <div className="desc-buttons">
              <button
                className="btn-ai"
                onClick={generateWithAI}
                disabled={loadingAI}
              >
                {loadingAI ? "Generating..." : "✨ Generate with AI"}
              </button>
              <button className="btn-save" onClick={saveDescription}>
                Save
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setEditingDesc(false);
                  setDescription(course.description || ""); // 恢复原值
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editingDesc ? (
          <p className="course-desc">
            {description ? description : "No description yet."}
          </p>
        ) : (
          <textarea
            className="desc-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Enter course description..."
          />
        )}
      </section>

      {/* --- Join Section --- */}
      <section className="card-section">
        <div className="section-header">
          <h3>Join Information</h3>
        </div>
        <p className="token-display">Join Token: {joinToken}</p>
        <div className="button-group">
          <button onClick={rotateToken} disabled={loading}>
            Refresh Token
          </button>
          <button onClick={toggleQR}>{showQR ? "Hide QR" : "Show QR"}</button>
        </div>
        {showQR && (
          <div className="qr-section">
            <img src={qrUrl} alt="Join QR" width={200} />
          </div>
        )}
      </section>

      {/* --- Roster Section --- */}
      <section className="card-section">
        <div className="section-header">
          <h3>Roster</h3>
          <button
            className="toggle-btn"
            onClick={() => setShowRoster(!showRoster)}
          >
            {showRoster ? " Hide Roster" : "Show Roster"}
          </button>
        </div>
        {showRoster && (
          <ul className="roster-list">
            {roster.length === 0 ? (
              <p>No students enrolled yet.</p>
            ) : (
              roster.map((s) => (
                <li key={s.id}>
                  {s.name} <span className="email">({s.email})</span>
                  <div className="roster-actions">
                    <Link
                      to={`/courses/${id}/evaluations/give?student=${s.id}`}
                    >
                      <button className="btn-small">⭐ Evaluate</button>
                    </Link>
                    <Link
                      to={`/courses/${id}/evaluations/request?student=${s.id}`}
                    >
                      <button className="btn-small">📨 Request</button>
                    </Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      {/* --- Teams Section --- */}
      <section className="card-section">
        <h3>Teams</h3>
        {teams.length === 0 ? (
          <p>No teams created yet.</p>
        ) : (
          <ul className="team-list">
            {teams.map((t) => (
              <li key={t.id} className="team-item">
                <span>{t.name}</span>
                <Link to={`/teams/${t.id}`}>
                  <button className="view-team">View</button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Evaluations Section --- */}
      <section className="card-section">
        <div className="section-header">
          <h3>Evaluations</h3>
        </div>
        <div className="button-group">
          <Link to={`/courses/${id}/evaluations/give`}>
            <button className="btn-seek">⭐ Give Evaluation</button>
          </Link>
          <Link to={`/courses/${id}/evaluations/request`}>
            <button className="btn-request">📨 Request Evaluation</button>
          </Link>
        </div>
      </section>
    </div>
  );
}
