const express = require("express");
const router = express.Router();

const db = require("../models");
const { requireAuth, requireRole } = require("../middleware/auth");

// ⭐ 1. 获取所有老师（instructor）
router.get(
  "/instructors",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const instructors = await db.User.findAll({
        where: { role: "instructor" },
        attributes: ["id", "name", "email"],
      });

      res.json(instructors);
    } catch (err) {
      console.error("❌ Error fetching instructors:", err);
      res.status(500).json({ error: "Server error fetching instructors" });
    }
  }
);

// ⭐ 2. 获取所有课程（含老师信息）
router.get("/courses", requireAuth, requireRole("admin"), async (req, res) => {
  try {
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
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
    res.status(500).json({ error: "Server error fetching courses" });
  }
});

// ⭐ 3. 获取某课程的所有学生
router.get(
  "/courses/:courseId/students",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
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

      // Enrollment.User 是学生对象
      res.json(enrollments.map((e) => e.User));
    } catch (err) {
      console.error("❌ Error fetching course students:", err);
      res.status(500).json({ error: "Server error fetching course students" });
    }
  }
);

module.exports = router;
