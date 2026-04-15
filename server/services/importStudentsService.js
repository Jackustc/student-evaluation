const bcrypt = require("bcryptjs");
const db = require("../models");

const { User, Course, Enrollment } = db;

// 👇 核心函数
async function importStudentsToCourse({ courseId, rows }) {
  console.log("🚀 Start importing students to course:", courseId);

  // -------------------------
  // 查课程
  // -------------------------
  const course = await Course.findByPk(courseId);

  if (!course) {
    throw new Error("Course not found");
  }

  console.log(`✅ Course found: id=${course.id}, code=${course.code}`);

  // -------------------------
  // 统计结果
  // -------------------------
  const summary = {
    total: rows.length,
    createdUsers: 0,
    existingUsers: 0,
    createdEnrollments: 0,
    skippedEnrollments: 0,
    errors: [],
  };

  // -------------------------
  // 逐个处理
  // -------------------------
  for (const s of rows) {
    console.log(`\n👉 Processing: ${s.email}`);

    try {
      // -------------------------
      // 数据清洗
      // -------------------------
      const email = s.email?.trim().toLowerCase();
      const name = s.name?.trim();
      const studentId = s.studentId?.trim();

      if (!email) {
        summary.errors.push({
          email: s.email,
          reason: "Missing email",
        });
        continue;
      }

      // -------------------------
      // 查用户（优先 email）
      // -------------------------
      let user = await User.findOne({
        where: { email },
      });

      // -------------------------
      // fallback：studentId
      // -------------------------
      //   if (!user && studentId) {
      //     user = await User.findOne({
      //       where: { studentId },
      //     });
      //   }

      // -------------------------
      // 创建用户
      // -------------------------
      if (!user) {
        console.log("👤 User not found → creating...");

        const hash = await bcrypt.hash(studentId, 8);

        user = await User.create({
          name,
          email,
          passwordHash: hash,
          role: "student",
          studentId,
        });

        summary.createdUsers++;
        console.log(`✅ User created: id=${user.id}`);
      } else {
        summary.existingUsers++;
        console.log(`⚠️ User exists: id=${user.id}`);
      }

      // -------------------------
      // 创建 Enrollment
      // -------------------------
      const existing = await Enrollment.findOne({
        where: {
          userId: user.id,
          courseId: course.id,
        },
      });

      if (!existing) {
        await Enrollment.create({
          userId: user.id,
          courseId: course.id,
        });

        summary.createdEnrollments++;
        console.log("✅ Enrollment CREATED");
      } else {
        summary.skippedEnrollments++;
        console.log("⚠️ Enrollment already exists");
      }
    } catch (err) {
      console.log("❌ ERROR processing:", s.email);

      summary.errors.push({
        email: s.email,
        reason: err.message,
      });
    }

    console.log("------------------------------------");
  }

  console.log("\n🎉 IMPORT DONE!");

  return summary;
}

module.exports = {
  importStudentsToCourse,
};
