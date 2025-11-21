const express = require("express");
const router = express.Router();
const db = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");

// ⭐ Admin 获取所有老师
router.get(
  "/instructors",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const instructors = await db.User.findAll({
      where: { role: "instructor" },
      attributes: ["id", "name", "email"],
    });
    res.json(instructors);
  }
);

// ⭐ Admin 获取所有课程（含老师信息）
router.get("/courses", requireAuth, requireRole("admin"), async (req, res) => {
  const courses = await db.Course.findAll({
    include: [
      {
        model: db.User,
        as: "instructor",
        attributes: ["id", "name", "email"],
      },
    ],
  });
  res.json(courses);
});

// ⭐ Admin 查看某课程的所有学生
router.get(
  "/courses/:courseId/students",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const { courseId } = req.params;

    const enrollments = await db.Enrollment.findAll({
      where: { CourseId: courseId },
      include: [
        {
          model: db.User,
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    res.json(enrollments.map((e) => e.User));
  }
);

module.exports = router;
