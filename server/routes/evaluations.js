const express = require("express");
const { requireAuth } = require("../middleware/auth");
const db = require("../models");

const router = express.Router();

// 给队友打分
// ✅ 打分：允许老师跨组打分，学生打分老师
router.post("/teams/:teamId/evaluations", requireAuth, async (req, res) => {
  const { evaluateeId, score, comment, anonymousToPeers } = req.body;
  const teamId = req.params.teamId;
  const evaluatorId = req.user.id;

  const evaluator = await db.User.findByPk(evaluatorId);
  const evaluatee = await db.User.findByPk(evaluateeId);

  // ✅ 获取课程信息（用于老师跨组）
  const team = await db.Team.findByPk(teamId, {
    include: { model: db.Course, attributes: ["id", "instructorId", "title"] },
  });

  if (!evaluator || !evaluatee) {
    return res.status(404).json({ error: "User not found." });
  }

  // 🚫 禁止学生给老师打分
  if (evaluator.role === "student" && evaluatee.role === "instructor") {
    return res.status(403).json({
      error: "Students cannot evaluate instructors.",
    });
  }

  //  检查双方是否在同一 team
  const evaluatorInTeam = await db.TeamMembership.findOne({
    where: { teamId, userId: evaluatorId },
  });
  const evaluateeInTeam = await db.TeamMembership.findOne({
    where: { teamId, userId: evaluateeId },
  });

  if (!(evaluatorInTeam && evaluateeInTeam)) {
    return res.status(403).json({
      error: "You can only evaluate your teammates.",
    });
  }

  // ✅ 确认通过后再创建互评
  const evalObj = await db.Evaluation.create({
    teamId,
    courseId: team.courseId,
    evaluatorId,
    evaluateeId,
    score,
    comment,
    anonymousToPeers,
  });

  // ✅ 通知被评价人
  try {
    const evaluatorDisplay =
      anonymousToPeers && evaluatee.role !== "instructor"
        ? "Anonymous"
        : evaluator.name || "Someone";

    await db.Notification.create({
      userId: evaluateeId,
      type: "evaluation_received",
      title: `New Evaluation Received in ${team.Course.title}`,
      body: `You received ${evaluatorDisplay}'s feedback from your team in ${team.Course.title}.`,
      link: `/teams/${teamId}/evaluations?tab=received`,
    });
  } catch (notifyErr) {
    console.error("⚠️ Failed to create notification:", notifyErr);
  }

  res.json(evalObj);
});

// ✅ 获取当前用户收到的所有评价
router.get("/teams/:teamId/evaluations/me", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const isInstructor = req.user.role === "instructor";

  try {
    const evals = await db.Evaluation.findAll({
      where: {
        teamId,
        evaluateeId: req.user.id, // 当前登录用户是被评价者
      },
      include: [
        { model: db.User, as: "evaluator", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = evals.map((e) => ({
      id: e.id,
      score: e.score,
      comment: e.comment,
      anonymousToPeers: e.anonymousToPeers,
      evaluatorId: e.evaluatorId,
      evaluatorName:
        // ✅ 老师可以始终看到真实姓名
        isInstructor
          ? e.evaluator.name
          : e.anonymousToPeers && e.evaluatorId !== req.user.id
            ? "Anonymous"
            : e.evaluator.name,
      createdAt: e.createdAt,
    }));

    console.log("🟢 My Received:", result);
    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching received evaluations:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 获取当前用户给出的所有评价
router.get(
  "/teams/:teamId/evaluations/given",
  requireAuth,
  async (req, res) => {
    const { teamId } = req.params;

    try {
      const evals = await db.Evaluation.findAll({
        where: {
          teamId,
          evaluatorId: req.user.id, // 当前登录用户是评价者
        },
        include: [
          { model: db.User, as: "evaluatee", attributes: ["id", "name"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      const result = evals.map((e) => ({
        id: e.id,
        score: e.score,
        comment: e.comment,
        evaluateeId: e.evaluateeId,
        evaluateeName: e.evaluatee?.name || "Unknown",
        anonymousToPeers: e.anonymousToPeers,
        createdAt: e.createdAt,
      }));

      console.log("🟢 My Given:", result);
      res.json(result);
    } catch (err) {
      console.error("❌ Error fetching given evaluations:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

// ✅ 获取当前小组所有评价（学生端+老师区分匿名）
// ✅ 获取当前小组所有评价（学生 & 老师共用）
router.get("/teams/:teamId/evaluations/all", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const isInstructor = req.user.role === "instructor"; // 🔹 关键判断

  try {
    const evals = await db.Evaluation.findAll({
      where: { teamId },
      include: [
        { model: db.User, as: "evaluator", attributes: ["id", "name"] },
        { model: db.User, as: "evaluatee", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = evals.map((e) => ({
      id: e.id,
      score: e.score,
      comment: e.comment,
      anonymousToPeers: e.anonymousToPeers,
      evaluatorId: e.evaluatorId,
      evaluatorName:
        // 🔹 如果匿名 + 访问者不是老师 + 访问者不是本人 → 匿名处理
        e.anonymousToPeers && !isInstructor && e.evaluatorId !== req.user.id
          ? "Anonymous"
          : e.evaluator?.name || "Unknown",
      evaluateeName: e.evaluatee?.name || "Unknown",
      createdAt: e.createdAt,
    }));

    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching evaluations:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 老师跨组打分（课程层）
router.post("/courses/:courseId/evaluations", requireAuth, async (req, res) => {
  try {
    const { evaluateeId, score, comment, anonymousToPeers } = req.body;
    const { courseId } = req.params;
    const evaluatorId = req.user.id;

    const evaluator = await db.User.findByPk(evaluatorId);
    const evaluatee = await db.User.findByPk(evaluateeId);
    const course = await db.Course.findByPk(courseId, {
      include: { model: db.User, as: "instructor", attributes: ["id", "name"] },
    });

    if (!course) return res.status(404).json({ error: "Course not found" });
    if (!evaluatee)
      return res.status(404).json({ error: "Evaluatee not found" });

    // // ✅ 权限：老师或课程 instructor 才能跨组打分
    // if (
    //   evaluator.role !== "instructor" ||
    //   course.instructorId !== evaluatorId
    // ) {
    //   return res
    //     .status(403)
    //     .json({ error: "Only course instructor can evaluate students." });
    // }
    // ✅ 权限：允许两种情况：
    // 1. 老师给学生打分（跨组）
    // 2. 学生给老师打分（课程层反馈）
    if (
      !(
        (evaluator.role === "instructor" &&
          course.instructorId === evaluatorId) ||
        (evaluator.role === "student" &&
          evaluatee.role === "instructor" &&
          evaluatee.id === course.instructorId)
      )
    ) {
      return res.status(403).json({
        error:
          "Only instructor can evaluate students, or students can evaluate their course instructor.",
      });
    }

    // // ✅ 自动获取该学生在本课程下的 team
    // const membership = await db.TeamMembership.findOne({
    //   include: [
    //     {
    //       model: db.Team,
    //       where: { courseId },
    //       attributes: ["id", "name"],
    //     },
    //   ],
    //   where: { userId: evaluateeId },
    // });

    // const teamId = membership ? membership.teamId : null; // 如果学生未分组，也允许为 null

    // ✅ 自动获取相关的 teamId
    let teamId = null;

    if (evaluator.role === "instructor" && evaluatee.role === "student") {
      // 老师给学生 → 查学生的组
      const membership = await db.TeamMembership.findOne({
        include: [
          { model: db.Team, where: { courseId }, attributes: ["id", "name"] },
        ],
        where: { userId: evaluateeId },
      });
      teamId = membership ? membership.teamId : null;
    }

    if (evaluator.role === "student" && evaluatee.role === "instructor") {
      // 学生给老师 → 查自己的组
      const membership = await db.TeamMembership.findOne({
        include: [
          { model: db.Team, where: { courseId }, attributes: ["id", "name"] },
        ],
        where: { userId: evaluatorId },
      });
      teamId = membership ? membership.teamId : null;
    }

    // ✅ 创建 Evaluation（不依赖 teamId）
    const evaluation = await db.Evaluation.create({
      teamId,
      courseId: courseId,
      evaluatorId,
      evaluateeId,
      score,
      comment,
      // anonymousToPeers: false, // 老师始终实名
      anonymousToPeers,
    });

    // ✅ 通知学生
    try {
      const displayName = anonymousToPeers
        ? "Anonymous"
        : evaluator.name || "Someone";

      await db.Notification.create({
        userId: evaluateeId,
        type: "evaluation_received",
        title: `New Evaluation from ${course.title}`,
        body: `You received ${displayName}'s feedback in ${course.title}.`,
        link: teamId
          ? `/teams/${teamId}/evaluations?tab=received`
          : `/courses/${courseId}/evaluations`,
        // link: `/teams/${teamId}/evaluations?tab=received`,
      });
    } catch (notifyErr) {
      console.error("⚠️ Failed to create notification:", notifyErr);
    }

    res.json(evaluation);
  } catch (err) {
    console.error("❌ Failed to create evaluation:", err);
    res.status(500).json({ error: "Server error creating evaluation." });
  }
});

module.exports = router;
