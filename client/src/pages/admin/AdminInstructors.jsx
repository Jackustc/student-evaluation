import { useEffect, useState } from "react";
import api from "../../api";
import RoleGate from "../../components/RoleGate";

export default function AdminInstructors() {
  const [list, setList] = useState([]);

  useEffect(() => {
    api.get("/admin/instructors").then((res) => setList(res.data));
  }, []);

  return (
    <RoleGate role="admin">
      <div style={{ padding: "20px" }}>
        <h2>All Instructors</h2>
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RoleGate>
  );
}
