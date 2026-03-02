import { useEffect, useState } from "react";
import api from "../api";
import "../styles/StudentPage.css";
import CourseCard from "../components/CourseCard";

export default function StudentPage() {
  const [joinToken, setJoinToken] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log("courses:", courses);

  // ✅ 页面加载时获取已加入的课程
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses/joined");
        // 按蓝图，这里返回学生加入的课程数组
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to load courses", err);
        alert(
          "Failed to load enrolled courses. Please check your login status"
        );
      }
    };
    fetchCourses();
  }, []);

  const joinCourse = async () => {
    if (!joinToken) {
      alert("Please enter course token");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/courses/join", { joinToken });
      const newCourse = res.data.course || res.data; // 假设后端返回 {course: {...}}
      setCourses([...courses, newCourse]); // ✅ 更新课程列表
      setJoinToken("");
    } catch (err) {
      console.error("Join course failed", err);
      alert(
        "Course Joined failed:" + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-container">
      <h2 className="dashboard-title">Student Dashboard</h2>

      <div className="join-form">
        <input
          value={joinToken}
          onChange={(e) => setJoinToken(e.target.value)}
          placeholder="Enter join token"
        />
        <button onClick={joinCourse} disabled={loading}>
          {loading ? "Joining..." : "Join"}
        </button>
      </div>

      <h3 className="course-header">My Courses</h3>
      {courses.length === 0 ? (
        <p className="empty-msg">You have not joined any courses yet.</p>
      ) : (
       <div className="course-grid">
          {courses
            .filter((c) => c !== null)
            .map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
      </div>
      )}
    </div>
  );
}
