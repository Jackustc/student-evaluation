const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// const crypto = require("crypto");
// const sgMail = require("@sendgrid/mail");

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 注册
router.post("/register", async (req, res) => {
  console.log("📩 Register body:", req.body);

  const { name, email, password, role, studentId } = req.body;
  try {
    const hash = await bcrypt.hash(password, 8);
    const user = await db.User.create({
      name,
      email,
      passwordHash: hash,
      role,
      studentId: role === "student" ? studentId : null,
    });

    // 注册完成直接返回 token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 登录
router.post("/login", async (req, res) => {
  console.log("REQ BODY:", req.body);
  const { email, password } = req.body;
  const user = await db.User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: "User not found" });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
  res.json({ token, user });
});

// router.post("/forgot-password", async (req, res) => {
//   const { email } = req.body;

//   const user = await db.User.findOne({ where: { email } });

//   // 不暴露用户是否存在
//   if (!user) {
//     return res.json({
//       message: "If this email exists, a reset link was sent.",
//     });
//   }

//   // 生成 token
//   const token = crypto.randomBytes(32).toString("hex");

//   // 1小时过期
//   const expiry = new Date(Date.now() + 60 * 60 * 1000);

//   user.resetToken = token;
//   user.resetTokenExpiry = expiry;
//   await user.save();

//   const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

//   const msg = {
//     to: user.email,
//     from: process.env.EMAIL_FROM,
//     subject: "Reset your password",
//     html: `
//       <p>You requested a password reset.</p>
//       <p>Click the link below:</p>
//       <a href="${resetLink}">${resetLink}</a>
//     `,
//   };

//   await sgMail.send(msg);

//   res.json({ message: "Reset link sent" });
// });

// // 重置密码
// router.post("/reset-password", async (req, res) => {
//   const { token, newPassword } = req.body;

//   // 找用户
//   const user = await db.User.findOne({
//     where: { resetToken: token },
//   });

//   if (!user) {
//     return res.status(400).json({ error: "Invalid token" });
//   }

//   // 检查是否过期
//   if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
//     return res.status(400).json({ error: "Token expired" });
//   }

//   // 更新密码
//   const hash = await bcrypt.hash(newPassword, 8);
//   user.passwordHash = hash;

//   // 清空 token（非常重要）
//   user.resetToken = null;
//   user.resetTokenExpiry = null;

//   await user.save();

//   res.json({ message: "Password reset successful" });
// });

// 获取当前登录用户信息

router.get("/me", requireAuth, async (req, res) => {
  const user = await db.User.findByPk(req.user.id, {
    attributes: ["id", "name", "email", "role", "studentId"],
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

module.exports = router;
