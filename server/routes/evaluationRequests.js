const express = require("express");
const router = express.Router();
const db = require("../models");
const { EvaluationRequest, TeamMembership } = db;
const { requireAuth } = require("../middleware/auth");

// ✅ 发起评价请求
// router.post(
//   "/teams/:teamId/evaluation-requests",
//   requireAuth,
//   async (req, res) => {
//     try {
//       const { requestee_id } = req.body;
//       const teamId = req.params.teamId;
//       const requesterId = req.user.id;

//       console.log(
//         "teamId:",
//         teamId,
//         "requesterId:",
//         requesterId,
//         "requestee_id:",
//         requestee_id
//       );

//       // // 确认双方在同一小组
//       // const requesterInTeam = await TeamMembership.findOne({
//       //   where: { teamId, userId: requesterId },
//       // });
//       // const requesteeInTeam = await TeamMembership.findOne({
//       //   where: { teamId, userId: requestee_id },
//       // });

//       // // console.log("requesterInTeam:", requesterInTeam);
//       // // console.log("requesteeInTeam:", requesteeInTeam);

//       // if (!requesterInTeam || !requesteeInTeam) {
//       //   return res
//       //     .status(403)
//       //     .json({ error: "Both users must be in the same team." });
//       // }

//       // 🔹 判断是否老师或同组成员
//       const requester = await db.User.findByPk(requesterId);
//       const requestee = await db.User.findByPk(requestee_id);

//       // 🔹 查询双方在不在该 team
//       const requesterInTeam = await TeamMembership.findOne({
//         where: { teamId, userId: requesterId },
//       });
//       const requesteeInTeam = await TeamMembership.findOne({
//         where: { teamId, userId: requestee_id },
//       });

//       // ✅ 允许以下几种情况通过：
//       // 1. 双方都在同一 team
//       // 2. 一方是 instructor（老师）且双方在同一课程下
//       const team = await db.Team.findByPk(teamId, {
//         include: { model: db.Course, attributes: ["id", "instructorId"] },
//       });

//       const isInstructor = requester.role === "instructor";
//       const isRequesteeInstructor = requestee.role === "instructor";
//       const isCourseInstructor =
//         team && team.Course && team.Course.instructorId === requesterId;
//       // ✅ 合法条件：
//       // 1. 双方都在同一 team ✅
//       // 2. 请求者是课程老师（可以跨组）✅
//       // 3. 学生请求课程老师（允许）✅
//       if (
//         !(
//           (requesterInTeam && requesteeInTeam) ||
//           isCourseInstructor ||
//           isRequesteeInstructor
//         )
//       ) {
//         return res.status(403).json({
//           error:
//             "You can only request evaluations from your teammates or course instructor.",
//         });
//       }
//       // const sameCourse =
//       //   team && team.Course.instructorId === requesterId
//       //     ? true
//       //     : team && team.Course.instructorId === requestee_id
//       //     ? true
//       //     : false;
//       // if (
//       //   (!requesterInTeam || !requesteeInTeam) &&
//       //   !sameCourse &&
//       //   requester.role !== "instructor"
//       // ) {
//       //   return res
//       //     .status(403)
//       //     .json({ error: "Must be teammates or instructor of this course." });
//       // }

//       // 检查是否已有待处理请求
//       const existing = await EvaluationRequest.findOne({
//         where: {
//           teamId,
//           requesterId,
//           requesteeId: requestee_id,
//           status: "pending",
//         },
//       });

//       if (existing) {
//         console.log(
//           "⚠️ Found existing pending request, sending reminder notification..."
//         );

//         // ✅ 即使已有请求，也创建一个“提醒通知”
//         try {
//           const requesterName = req.user.name || "Someone";
//           await db.Notification.create({
//             userId: requestee_id, // 被请求人
//             type: "evaluation_request",
//             title: "Reminder: Evaluation Request Still Pending",
//             body: `${requesterName} requested your evaluation (still pending).`,
//             link: `/teams/${teamId}/evaluations`,
//           });
//           console.log(`✅ Reminder notification sent for existing request`);
//         } catch (notifyErr) {
//           console.error(
//             "⚠️ Failed to create reminder notification:",
//             notifyErr
//           );
//         }

//         return res.json(existing); // ✅ 返回现有请求
//       }

//       // 没有重复，则创建新请求
//       const newRequest = await EvaluationRequest.create({
//         teamId,
//         requesterId,
//         requesteeId: requestee_id,
//         status: "pending",
//       });

//       // ✅ 发送通知给被请求人
//       try {
//         const requester = req.user.name || "Someone";
//         await db.Notification.create({
//           userId: requestee_id, // 被请求人
//           type: "evaluation_request",
//           title: "New Evaluation Request",
//           body: `${requester} requested your evaluation.`,
//           link: `/teams/${teamId}/evaluations`,
//         });
//       } catch (notifyErr) {
//         console.error(
//           "⚠️ Failed to create notification for requestee:",
//           notifyErr
//         );
//       }

//       res.json(newRequest);
//     } catch (err) {
//       console.error("❌ Failed to create evaluation request:", err);
//       res
//         .status(500)
//         .json({ error: "Server error creating evaluation request" });
//     }
//   }
// );

// ✅ 发起评价请求（允许学生请求老师，老师可跨组请求学生）
router.post(
  "/teams/:teamId/evaluation-requests",
  requireAuth,
  async (req, res) => {
    try {
      const { requestee_id } = req.body;
      const teamId = req.params.teamId;
      const requesterId = req.user.id;

      const requester = await db.User.findByPk(requesterId);
      const requestee = await db.User.findByPk(requestee_id);

      // 查询双方在当前 team 的成员记录
      const requesterInTeam = await TeamMembership.findOne({
        where: { teamId, userId: requesterId },
      });
      const requesteeInTeam = await TeamMembership.findOne({
        where: { teamId, userId: requestee_id },
      });

      // 拿到课程信息（用来判断老师和学生的关系）
      const team = await db.Team.findByPk(teamId, {
        include: {
          model: db.Course,
          attributes: ["id", "instructorId", "title"],
        },
      });

      const isRequesterInstructor = requester.role === "instructor";
      const isRequesteeInstructor = requestee.role === "instructor";
      const isCourseInstructor =
        team && team.Course && team.Course.instructorId === requesterId;

      // ✅ 合法条件：
      // 1. 同组学生互相请求
      if (!(requesterInTeam && requesteeInTeam)) {
        return res.status(403).json({
          error:
            "You can only request evaluations from your teammates or your course instructor.",
        });
      }

      // 检查是否已有未处理请求
      const existing = await EvaluationRequest.findOne({
        where: {
          teamId,
          requesterId,
          requesteeId: requestee_id,
          status: "pending",
        },
      });

      if (existing) {
        // 已存在请求则发提醒通知
        const requesterName = requester.name || "Someone";
        await db.Notification.create({
          userId: requestee_id,
          type: "evaluation_request",
          title: "Reminder: Evaluation Request Still Pending",
          body: `${requesterName} requested your evaluation (still pending).`,
          link: `/teams/${teamId}/evaluations`,
        });
        return res.json(existing);
      }

      // 创建新请求
      const newRequest = await EvaluationRequest.create({
        teamId,
        courseId: team.courseId,
        requesterId,
        requesteeId: requestee_id,
        status: "pending",
      });

      // 通知被请求人
      try {
        const requesterName = requester.name || "Someone";

        // 获取课程标题
        const courseName = team?.Course?.title || "your course";

        await db.Notification.create({
          userId: requestee_id,
          type: "evaluation_request",
          title: `Evaluation Request in ${courseName}`,
          body: `${requesterName} reminded you about an evaluation request from your team in ${courseName}.`,
          link: `/teams/${teamId}/evaluations`,
        });
      } catch (notifyErr) {
        console.error("⚠️ Failed to create notification:", notifyErr);
      }

      res.json(newRequest);
    } catch (err) {
      console.error("❌ Failed to create evaluation request:", err);
      res
        .status(500)
        .json({ error: "Server error creating evaluation request" });
    }
  },
);

// ✅ 我发起的请求
router.get("/me/requests/sent", requireAuth, async (req, res) => {
  const list = await EvaluationRequest.findAll({
    where: { requesterId: req.user.id },
    include: ["Requestee"],
  });
  res.json(list);
});

// ✅ 我收到的请求
router.get("/me/requests/received", requireAuth, async (req, res) => {
  const list = await EvaluationRequest.findAll({
    where: { requesteeId: req.user.id },
    include: ["Requester"],
  });
  res.json(list);
});

// ✅ 更新请求状态（完成）
router.patch("/evaluation-requests/:id", requireAuth, async (req, res) => {
  const { status } = req.body;
  const request = await EvaluationRequest.findByPk(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });
  request.status = status || "completed";
  await request.save();
  res.json(request);
});

// ✅ 老师跨组请求学生提交互评（课程层）
router.post(
  "/courses/:courseId/request-student-evaluation",
  requireAuth,
  async (req, res) => {
    try {
      const { requestee_id } = req.body;
      const { courseId } = req.params;
      const requesterId = req.user.id;

      const requester = await db.User.findByPk(requesterId);
      const requestee = await db.User.findByPk(requestee_id);
      const course = await db.Course.findByPk(courseId, {
        include: {
          model: db.User,
          as: "instructor",
          attributes: ["id", "name"],
        },
      });

      if (!course) return res.status(404).json({ error: "Course not found" });
      if (!requestee) return res.status(404).json({ error: "User not found" });

      // ✅ 权限检查：老师或课程 instructor 才能发起
      if (
        requester.role !== "instructor" ||
        course.instructorId !== requesterId
      ) {
        return res
          .status(403)
          .json({ error: "Only course instructor can request evaluations." });
      }

      // ✅ 自动查出学生在该课程下的 team
      const membership = await db.TeamMembership.findOne({
        include: [
          {
            model: db.Team,
            where: { courseId },
            attributes: ["id", "name"],
          },
        ],
        where: { userId: requestee_id },
      });

      const teamId = membership ? membership.teamId : null;

      // 检查是否已有 pending 请求
      const existing = await db.EvaluationRequest.findOne({
        where: {
          teamId,
          requesterId,
          requesteeId: requestee_id,
          status: "pending",
        },
      });
      if (existing) {
        await db.Notification.create({
          userId: requestee_id,
          type: "evaluation_request",
          title: `Reminder: Evaluation Request from ${course.title}`,
          body: `Your instructor ${requester.name} reminded you to complete an evaluation.`,
          link: `/courses/${courseId}`,
        });
        return res.json(existing);
      }

      // ✅ 创建新请求
      const newRequest = await db.EvaluationRequest.create({
        teamId,
        courseId: team.courseId,
        requesterId,
        requesteeId: requestee_id,
        status: "pending",
      });

      // ✅ 通知学生
      await db.Notification.create({
        userId: requestee_id,
        type: "evaluation_request",
        title: `Evaluation Request from ${course.title}`,
        body: `Your instructor ${requester.name} requested you to complete a course evaluation.`,
        link: `/courses/${courseId}`,
      });

      res.json(newRequest);
    } catch (err) {
      console.error(
        "❌ Failed to create course-level evaluation request:",
        err,
      );
      res
        .status(500)
        .json({ error: "Server error creating evaluation request." });
    }
  },
);

// ✅ 学生请求老师给自己评价
router.post(
  "/courses/:courseId/request-instructor-evaluation",
  requireAuth,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const requesterId = req.user.id; // 学生
      const course = await db.Course.findByPk(courseId, {
        include: {
          model: db.User,
          as: "instructor",
          attributes: ["id", "name"],
        },
      });

      if (!course) return res.status(404).json({ error: "Course not found" });

      const instructorId = course.instructorId;

      // ✅ 权限：只能学生发起，请求自己课程的老师
      const requester = await db.User.findByPk(requesterId);
      if (requester.role !== "student") {
        return res
          .status(403)
          .json({ error: "Only students can request instructor evaluations." });
      }

      // ✅ 查学生自己的 team
      const membership = await db.TeamMembership.findOne({
        include: [
          { model: db.Team, where: { courseId }, attributes: ["id", "name"] },
        ],
        where: { userId: requesterId },
      });
      const teamId = membership ? membership.teamId : null;

      // ✅ 检查是否已有 pending 请求
      const existing = await db.EvaluationRequest.findOne({
        where: {
          teamId,
          requesterId,
          requesteeId: instructorId,
          status: "pending",
        },
      });
      if (existing) {
        await db.Notification.create({
          userId: instructorId,
          type: "evaluation_request",
          title: `Reminder: Evaluation Request from ${course.title}`,
          body: `${requester.name} requested your evaluation again.`,
          link: `/courses/${courseId}/evaluations/give?student=${requesterId}`,
        });
        return res.json(existing);
      }

      // ✅ 创建新请求
      const newRequest = await db.EvaluationRequest.create({
        teamId,
        courseId: team.courseId,
        requesterId,
        requesteeId: instructorId,
        status: "pending",
      });

      // ✅ 通知老师
      await db.Notification.create({
        userId: instructorId,
        type: "evaluation_request",
        title: `Evaluation Request from ${course.title}`,
        body: `${requester.name} requested your evaluation in ${course.title}.`,
        link: `/courses/${courseId}/evaluations/give?student=${requesterId}`,
      });

      res.json(newRequest);
    } catch (err) {
      console.error("❌ Student→Instructor request failed:", err);
      res.status(500).json({
        error: "Server error creating instructor evaluation request.",
      });
    }
  },
);

module.exports = router;
