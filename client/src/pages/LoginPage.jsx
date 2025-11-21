import { useState } from "react";
import { useAuthStore } from "../store/auth";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";

export default function LoginPage() {
  const { login, register, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [studentId, setStudentId] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      // await register(name, email, password, role, studentId);
      const fullEmail = `${email}@northeastern.edu`.trim();
      await register(name, fullEmail, password, role, studentId);

      alert("Registered! Please login.");
      setIsRegister(false);
    } else {
      try {
        // const user = await login(email, password);
        const fullEmail = `${email}@northeastern.edu`.trim();
        const user = await login(fullEmail, password);
        console.log("LOGIN RESULT:", user);
        // if (user?.role === "instructor") {
        //   navigate("/instructor");
        // } else {
        //   navigate("/student");
        // }
        const redirect = new URLSearchParams(window.location.search).get(
          "redirect"
        );

        if (redirect) {
          navigate(redirect);
        } else if (user?.role === "admin") {
          navigate("/admin");
        } else if (user?.role === "instructor") {
          navigate("/instructor");
        } else {
          navigate("/student");
        }
      } catch (err) {
        const msg =
          err.response?.data?.error || // 后端返回 error
          err.response?.data?.message || // 有的接口用 message
          err.message;
        alert("Login failed: " + msg);
      }
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">{isRegister ? "Register" : "Login"}</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
            {/* ✅ 只有学生时显示学号输入 */}
            {role === "student" && (
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Student ID"
              />
            )}
          </>
        )}
        <div className="email-wrapper">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email prefix"
          />
          <span className="email-suffix">@northeastern.edu</span>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />

        <button type="submit" className="submit-btn">
          {isRegister ? "Register" : "Login"}
        </button>
      </form>
      <button className="toggle-btn" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Have account? Login" : "No account? Register"}
      </button>
    </div>
  );
}
