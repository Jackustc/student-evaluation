import { create } from "zustand";
import api from "../api";

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,

  // 登录
  login: async (email, password) => {
    // console.log("DEBUG login params:", email, password);
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token });
    return user; // 返回 user
  },
  // login: async (email, password) => {
  //   const res = await api.post("/auth/login", { email, password });
  //   const { token, user } = res.data;
  //   // 保存到 localStorage
  //   localStorage.setItem("token", token);
  //   localStorage.setItem("user", JSON.stringify(user));
  //   // 更新全局状态
  //   set({ user, token });
  //   return user;
  // },

  register: async (name, email, password, role, studentId) => {
    await api.post("/auth/register", {
      name,
      email,
      password,
      role,
      studentId,
    });
  },

  // ✅ 新增：刷新后自动验证并恢复用户
  fetchMe: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data, token });
    } catch (err) {
      console.warn("Token invalid, logging out.");
      localStorage.removeItem("token");
      set({ user: null, token: null });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));
