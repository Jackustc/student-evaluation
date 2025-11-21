import { useEffect, useState } from "react";
import api from "../../api";
import { Link } from "react-router-dom";
import RoleGate from "../../components/RoleGate";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get("/admin/courses").then((res) => setCourses(res.data));
  }, []);

  return (
    <RoleGate role="admin">
      <div style={{ padding: "20px" }}>
        <h2>All Courses</h2>

        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Code</th>
              <th>Instructor</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.title}</td>
                <td>{c.code}</td>
                <td>{c.instructor?.name}</td>
                <td>
                  <Link to={`/admin/courses/${c.id}/students`}>
                    View Students
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RoleGate>
  );
}
