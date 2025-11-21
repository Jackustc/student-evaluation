import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import RoleGate from "../../components/RoleGate";

export default function AdminCourseStudents() {
  const { courseId } = useParams();
  const [list, setList] = useState([]);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    // 获取课程列表，然后找到当前课程
    api.get(`/admin/courses`).then((res) => {
      const found = res.data.find((c) => c.id === Number(courseId));
      setCourse(found || null);
    });

    // 获取学生列表
    api
      .get(`/admin/courses/${courseId}/students`)
      .then((res) => setList(res.data));
  }, [courseId]);

  return (
    <RoleGate role="admin">
      <div style={{ padding: "20px" }}>
        {/* course title */}
        <h2>Students in Course {course ? course.title : ""}</h2>

        {course && (
          <div style={{ marginBottom: "20px" }}>
            <p>
              <strong>Code:</strong> {course.code}
            </p>
            <p>
              <strong>Instructor:</strong>{" "}
              {course.instructor?.name ?? "Unknown"}
            </p>
          </div>
        )}

        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RoleGate>
  );
}
