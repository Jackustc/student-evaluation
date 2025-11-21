import { useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function JoinPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    const userToken = localStorage.getItem("token"); // 你的身份登录用的 JWT

    if (!token) {
      alert("Invalid join link");
      navigate("/");
      return;
    }

    // ❗ 如果用户没有登录，先跳登录
    if (!userToken) {
      navigate(`/login?redirect=/join?token=${token}`);
      return;
    }

    async function joinCourse() {
      try {
        const res = await api.post("/courses/join", { joinToken: token });
        if (res.data.message === "already-in") {
          // 用户已经在课程中
          navigate("/student");
        } else {
          alert("Joined successfully!");
          navigate("/student");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to join course");
        navigate("/student");
      }
    }

    joinCourse();
  }, []);

  return <p>Joining course...</p>;
}
