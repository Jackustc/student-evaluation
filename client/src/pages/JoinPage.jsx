import { useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function JoinPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
      alert("Invalid join link");
      navigate("/");
      return;
    }

    async function joinCourse() {
      try {
        const res = await api.post("/courses/join", { joinToken: token });
        alert("Joined successfully!");
        navigate("/student"); // 根据你系统改
      } catch (err) {
        console.error(err);
        alert("Failed to join course");
        navigate("/");
      }
    }

    joinCourse();
  }, []);

  return <p>Joining course...</p>;
}
