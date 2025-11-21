import { useAuthStore } from "../store/auth";
import { Navigate } from "react-router-dom";

export default function RoleGate({ role, children }) {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/login" />;
  if (role !== user.role && user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}
