import { Link } from "react-router-dom";
import RoleGate from "../../components/RoleGate";

export default function AdminHome() {
  return (
    <RoleGate role="admin">
      <div style={{ padding: "20px" }}>
        <h1>Admin Dashboard</h1>

        <ul>
          <li>
            <Link to="/admin/instructors">View All Instructors</Link>
          </li>
          <li>
            <Link to="/admin/courses">View All Courses</Link>
          </li>
        </ul>
      </div>
    </RoleGate>
  );
}
