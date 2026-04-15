import { useRef, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/InstructorCoursePage.css";

export default function InstructorCoursePage() {
  const fileInputRef = useRef(null);

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

  const navigate = useNavigate();

  const [message, setMessage] = useState("");

  const [csvFile, setCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  const fetchRoster = async () => {
    try {
      const resRoster = await api.get(`/courses/${id}/roster`);
      console.log("ROSTER DATA 👉", resRoster.data);
      setRoster(resRoster.data);
    } catch (err) {
      console.error("Failed to load roster:", err);
      showMessage("❌ Failed to load roster");
    }
  };

  const fetchTeams = async () => {
    try {
      const resTeams = await api.get(`/courses/${id}/teams`);
      setTeams(resTeams.data);
    } catch (err) {
      console.error("Failed to load teams:", err);
      showMessage("❌ Failed to load teams");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const resCourses = await api.get("/courses/mine");
        const found = resCourses.data.find((c) => c.id === Number(id));
        setCourse(found);
        setDescription(found?.description || "");
        setJoinToken(found?.joinToken);

        await Promise.all([fetchRoster(), fetchTeams()]);
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

  const handleUploadCsv = async () => {
    if (!csvFile) {
      showMessage("❌ Please select a CSV file first");
      return;
    }

    try {
      setUploadingCsv(true);
      setImportSummary(null);

      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await api.post(`/courses/${id}/roster/import-csv`, formData);

      setImportSummary(res.data.summary);
      showMessage("✅ CSV imported successfully");

      // 上传成功后刷新 roster
      await fetchRoster();

      // 清空已选文件
      setCsvFile(null);
    } catch (err) {
      console.error("CSV upload failed:", err);

      console.log("👉 backend response:", err.response?.data);

      showMessage(
        err.response?.data?.error ||
          JSON.stringify(err.response?.data) ||
          "❌ Failed to import CSV",
      );
    } finally {
      setUploadingCsv(false);
    }
  };

  const handleDeleteCourse = async () => {
    const confirmed = window.prompt(
      `Please enter the course title to confirm deletion:\n${course.title}`,
    );

    // ⭐ 先判断用户是否点了 Cancel
    if (!confirmed || confirmed.trim() !== course.title) {
      showMessage("❌ Course title mismatch. Deletion cancelled.");
      return;
    }

    try {
      await api.delete(`/courses/${id}`, {
        data: { confirmTitle: confirmed.trim() },
      });

      showMessage("✅ Course deleted successfully");
      setTimeout(() => navigate("/instructor"), 800);
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.error || "❌ Failed to delete course");
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
        <div className="csv-upload-section">
          <h4 style={{ marginBottom: "8px" }}>Import Students by CSV</h4>

          <div className="csv-upload-row">
            <input
              className="csv-input"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setCsvFile(selected);
              }}
            />

            <button
              className="csv-upload-btn"
              onClick={handleUploadCsv}
              disabled={uploadingCsv}
            >
              {uploadingCsv ? "Uploading..." : "Upload CSV"}
            </button>
          </div>

          {csvFile && (
            <p className="csv-file-name">Selected file: {csvFile.name}</p>
          )}

          {importSummary && (
            <div className="csv-summary">
              <p>
                <strong>Import Result</strong>
              </p>
              <p>Total Rows: {importSummary.total}</p>
              <p>Created Users: {importSummary.createdUsers}</p>
              <p>Existing Users: {importSummary.existingUsers}</p>
              <p>Created Enrollments: {importSummary.createdEnrollments}</p>
              <p>Skipped Enrollments: {importSummary.skippedEnrollments}</p>

              {importSummary.errors?.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <p style={{ color: "red" }}>
                    Errors: {importSummary.errors.length}
                  </p>
                  <ul style={{ marginTop: "6px", paddingLeft: "18px" }}>
                    {importSummary.errors.map((err, index) => (
                      <li key={index}>
                        {err.email || "Unknown email"} — {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        {showRoster && (
          <ul className="roster-list">
            {roster.length === 0 ? (
              <p>No students enrolled yet.</p>
            ) : (
              roster.map((s) => (
                <li
                  key={s.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flex: 1,
                    }}
                  >
                    <Link
                      to={`/instructor/courses/${id}/students/${s.id}`}
                      className="student-link"
                    >
                      {s.name}
                    </Link>

                    <span style={{ display: "inline-flex", gap: "6px" }}>
                      <span
                        style={{
                          background: "#ede9fe",
                          color: "#4f46e5",
                          padding: "2px 8px",
                          borderRadius: "99px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        Sent {s.givenCount}
                      </span>
                      <span
                        style={{
                          background: "#ede9fe",
                          color: "#4f46e5",
                          padding: "2px 8px",
                          borderRadius: "99px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        Received {s.receivedCount}
                      </span>
                    </span>

                    <span className="email">({s.email})</span>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
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

      <section className="card-section danger-zone">
        <h3>Danger Zone</h3>
        <button className="btn-delete-course" onClick={handleDeleteCourse}>
          Delete Course
        </button>
      </section>
    </div>
  );
}
