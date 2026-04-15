const express = require("express");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { requireAuth, requireRole } = require("../middleware/auth");
const db = require("../models");

const router = express.Router();

// 老师建课
router.post("/", requireAuth, requireRole("instructor"), async (req, res) => {
  const { title, code, aiEnabled } = req.body;
  const joinToken = uuidv4();
  const course = await db.Course.create({
    title,
    code,
    joinToken,
    instructorId: req.user.id,
    aiEnabled: !!aiEnabled,
  });
  res.json(course);
});

// 学生用 token 加入
router.post("/join", requireAuth, async (req, res) => {
  const { joinToken } = req.body;
  const course = await db.Course.findOne({ where: { joinToken } });
  if (!course) return res.status(404).json({ error: "Course not found" });

  // await db.Enrollment.findOrCreate({
  //   where: { courseId: course.id, userId: req.user.id },
  // });

  // res.json({ message: "Joined", course });
  // res.json({ message: "Joined", courseId: course.id });

  // ⭐ 关键修改: findOrCreate 会告诉我们 Enrollment 是创建的还是已经存在的
  const [enrollment, created] = await db.Enrollment.findOrCreate({
    where: {
      courseId: course.id,
      userId: req.user.id,
    },
  });

  // ⭐ 返回给前端的状态
  res.json({
    message: created ? "joined" : "already-in",
    course,
  });
});

// 老师获取自己建的课程
router.get(
  "/mine",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    console.log(">>> GET /courses/mine called by user:", req.user);
    try {
      const courses = await db.Course.findAll({
        where: { instructorId: req.user.id },
      });
      res.json(courses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ✅ 老师更新课程描述
router.patch(
  "/:courseId/description",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { description } = req.body;

      const course = await db.Course.findByPk(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      // 只能修改自己创建的课程
      if (course.instructorId !== req.user.id)
        return res.status(403).json({ error: "Not authorized" });

      course.description = description || "";
      await course.save();

      res.json({ message: "✅ Course description updated", course });
    } catch (err) {
      console.error("❌ Failed to update course description:", err);
      res.status(500).json({ error: "Server error updating description" });
    }
  }
);

// ✅ 更新 Course title & code
router.patch(
  "/:courseId/basic",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, code } = req.body;

      const course = await db.Course.findByPk(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      // 只能改自己的课程
      if (course.instructorId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // 更新字段
      if (title !== undefined) course.title = title;
      if (code !== undefined) course.code = code;

      await course.save();

      res.json({
        message: "Course title/code updated",
        course,
      });
    } catch (err) {
      console.error("❌ Failed to update basic info:", err);
      res.status(500).json({ error: "Server error updating basic info" });
    }
  }
);

// ✅ 更新 AI Assistant 开关
router.patch(
  "/:id/ai-enabled",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { aiEnabled } = req.body;

      const course = await db.Course.findByPk(id);
      if (!course) return res.status(404).json({ error: "Course not found" });

      course.aiEnabled = !!aiEnabled;
      await course.save();

      res.json({
        message: "AI Assistant setting updated",
        aiEnabled: course.aiEnabled,
      });
    } catch (err) {
      console.error("❌ Failed to update aiEnabled:", err);
      res.status(500).json({ error: "Server error updating aiEnabled" });
    }
  }
);

// 学生获取自己加入的课程
router.get("/joined", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const enrollments = await db.Enrollment.findAll({
      where: { userId: req.user.id },
      // include: [db.Course],
      include: [
        {
          model: db.Course,
          required: true, 
          include: [
            {
              model: db.User,
              as: "instructor",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    });
    res.json(
      enrollments
        .map((e) => e.Course)
        .filter((course) => course !== null)
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ 创建 Team
router.post("/:courseId/teams", requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Missing team name" });

    const team = await db.Team.create({ courseId, name });
    // ✅ 只有学生创建才自动加入
    if (req.user.role === "student") {
      await db.TeamMembership.create({ TeamId: team.id, UserId: req.user.id });
    }
    // await db.TeamMembership.create({ teamId: team.id, userId: req.user.id });
    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// ✅ 老师查看某个学生在该课程的 evaluation history
router.get(
  "/:courseId/students/:studentId/evaluation-history",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    try {
      const { courseId, studentId } = req.params;

      // =============================
      // 1️⃣ 校验 course 是否存在
      // =============================
      const course = await db.Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // =============================
      // 2️⃣ 权限校验：必须是该 instructor
      // =============================
      if (course.instructorId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // =============================
      // 3️⃣ 校验 student 是否在该课程
      // =============================
      const enrollment = await db.Enrollment.findOne({
        where: {
          courseId,
          userId: studentId,
        },
      });

      if (!enrollment) {
        return res.status(403).json({
          error: "Student not enrolled in this course",
        });
      }

      // =============================
      // 4️⃣ 获取 student 基本信息
      // =============================
      const student = await db.User.findByPk(studentId, {
        attributes: ["id", "name", "email", "studentId"],
      });

      // =============================
      // 5️⃣ 查询：Given Evaluations
      // =============================
      const given = await db.Evaluation.findAll({
        where: { evaluatorId: studentId },
        include: [
          {
            model: db.Team,
            where: { courseId },
            attributes: ["id", "name"],
          },
          {
            model: db.User,
            as: "evaluatee",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // =============================
      // 6️⃣ 查询：Received Evaluations
      // =============================
      const received = await db.Evaluation.findAll({
        where: { evaluateeId: studentId },
        include: [
          {
            model: db.Team,
            where: { courseId },
            attributes: ["id", "name"],
          },
          {
            model: db.User,
            as: "evaluator",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // =============================
      // 7️⃣ 查询：Requests Sent
      // =============================
      const requestsSent = await db.EvaluationRequest.findAll({
        where: { requesterId: studentId },
        include: [
          {
            model: db.Team,
            where: { courseId },
            attributes: ["id", "name"],
          },
          {
            model: db.User,
            as: "Requestee",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // =============================
      // 8️⃣ 查询：Requests Received
      // =============================
      const requestsReceived = await db.EvaluationRequest.findAll({
        where: { requesteeId: studentId },
        include: [
          {
            model: db.Team,
            where: { courseId },
            attributes: ["id", "name"],
          },
          {
            model: db.User,
            as: "Requester",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // =============================
      // 9️⃣ 返回数据
      // =============================
      res.json({
        student,
        given,
        received,
        requestsSent,
        requestsReceived,
      });
    } catch (err) {
      console.error("❌ Failed to fetch evaluation history:", err);
      res.status(500).json({
        error: "Server error fetching evaluation history",
      });
    }
  }
);
// ✅ 获取单个课程详情
router.get("/:courseId", requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await db.Course.findByPk(courseId, {
      include: [
        {
          model: db.User,
          as: "instructor",
          attributes: ["id", "name", "email"],
        },
      ],
    });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// ✅ 获取课程下所有 Teams
router.get("/:courseId/teams", requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const teams = await db.Team.findAll({
      where: { courseId },
      include: [
        {
          model: db.TeamMembership,
          include: [{ model: db.User, attributes: ["id", "name", "email"] }],
        },
      ],
    });
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// ✅ 老师查看课程学生
// ✅ 老师查看课程学生（带统计）
router.get(
  "/:courseId/roster",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // 1️⃣ 找 enrollment + user
      const enrollments = await db.Enrollment.findAll({
        where: { courseId },
        include: [
          {
            model: db.User,
            attributes: ["id", "name", "email", "studentId"],
          },
        ],
      });

      // 2️⃣ 遍历每个 student 加统计
      const roster = await Promise.all(
        enrollments.map(async (e) => {
          const user = e.User;

          // ⭐ given count
          const givenCount = await db.Evaluation.count({
            where: { evaluatorId: user.id },
            include: [
              {
                model: db.Team,
                where: { courseId },
              },
            ],
          });

          // ⭐ received count
          const receivedCount = await db.Evaluation.count({
            where: { evaluateeId: user.id },
            include: [
              {
                model: db.Team,
                where: { courseId },
              },
            ],
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            studentId: user.studentId,
            givenCount,
            receivedCount,
          };
        })
      );

      res.json(roster);
    } catch (err) {
      console.error("❌ Failed to fetch roster:", err);
      res.status(500).json({ error: "Server error fetching roster" });
    }
  }
);



// ✅ 刷新 Join Token
router.post(
  "/:courseId/join-token/rotate",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const newToken = uuidv4();

      const course = await db.Course.findByPk(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      // 仅允许课程创建者刷新
      if (course.instructorId !== req.user.id)
        return res.status(403).json({ error: "Not authorized" });

      course.joinToken = newToken;
      await course.save();

      res.json({ joinToken: newToken });
    } catch (err) {
      console.error("❌ Failed to rotate token:", err);
      res.status(500).json({ error: "Failed to rotate join token" });
    }
  }
);

// ✅ 生成课程 Join QR
router.get(
  "/:courseId/join-qr",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await db.Course.findByPk(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      // console.log("CORS_ORIGIN =", process.env.CORS_ORIGIN);
      const joinUrl = `${process.env.CORS_ORIGIN}/join?token=${course.joinToken}`;
      const qrDataUrl = await QRCode.toDataURL(joinUrl);

      res.json({ joinUrl, qrDataUrl });
    } catch (err) {
      console.error("❌ Failed to generate QR:", err);
      res.status(500).json({ error: "Server error generating QR" });
    }
  }
);

// ✅ 删除课程（带服务器确认机制）
router.delete(
  "/:courseId",
  requireAuth,
  requireRole("instructor"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { confirmTitle } = req.body; // 👈 改成 confirmTitle

      const course = await db.Course.findByPk(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      if (course.instructorId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }


      console.log("confirmTitle =", confirmTitle);
      console.log("course.title =", course.title);

      // ✅ 输入课程标题确认
      if ((confirmTitle || "").trim() !== course.title) {
        return res.status(400).json({
          error: `Confirmation required. Send { confirmTitle: "${course.title}" }`,
        });
      }

      await course.destroy();
      res.json({ message: "Course deleted successfully" });
    } catch (err) {
      console.error("❌ Failed to delete course:", err);
      res.status(500).json({ error: "Server error deleting course" });
    }
  }
);


module.exports = router;
