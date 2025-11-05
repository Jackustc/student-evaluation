// server/routes/evaluationLikes.js
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const db = require("../models");

const router = express.Router();

/**
 * 👍 点赞或取消点赞（toggle）
 * POST /evaluation-likes/:evaluationId/like
 */
router.post("/:evaluationId/like", requireAuth, async (req, res) => {
  const { evaluationId } = req.params;
  const userId = req.user.id;

  try {
    // 查找是否已有点赞
    const existing = await db.EvaluationLike.findOne({
      where: { evaluationId, userId },
    });

    if (existing) {
      // 取消点赞
      await existing.destroy();
      return res.json({ liked: false });
    } else {
      // 新建点赞
      await db.EvaluationLike.create({ evaluationId, userId });
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error("❌ Like toggle error:", err);
    return res.status(500).json({ error: "Failed to toggle like" });
  }
});

/**
 * 🔢 获取点赞数量
 * GET /evaluation-likes/:evaluationId/likes
 */
router.get("/:evaluationId/likes", requireAuth, async (req, res) => {
  const { evaluationId } = req.params;

  try {
    const count = await db.EvaluationLike.count({ where: { evaluationId } });
    return res.json({ likes: count });
  } catch (err) {
    console.error("❌ Get like count error:", err);
    return res.status(500).json({ error: "Failed to get like count" });
  }
});

/**
 * ✅ 检查当前用户是否点过赞（可选）
 * GET /evaluation-likes/:evaluationId/liked-by-me
 */
router.get("/:evaluationId/liked-by-me", requireAuth, async (req, res) => {
  const { evaluationId } = req.params;
  const userId = req.user.id;

  try {
    const existing = await db.EvaluationLike.findOne({
      where: { evaluationId, userId },
    });
    return res.json({ liked: !!existing });
  } catch (err) {
    console.error("❌ Check liked-by-me error:", err);
    return res.status(500).json({ error: "Failed to check like state" });
  }
});

module.exports = router;
