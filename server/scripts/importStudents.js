const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const db = require("../models");
const { User, Course, Enrollment } = db;

const bcrypt = require("bcryptjs");

async function importStudents() {
  console.log("🚀 Start importing from CSV...");
  console.log("📂 CSV Path:", path.resolve(__dirname, "../data/students.csv"));

  const results = [];

  // 1️⃣ 读取 CSV
  await new Promise((resolve) => {
    fs.createReadStream(path.resolve(__dirname, "../data/students.csv"))
      .pipe(csv())
      .on("data", (data) => {
        console.log("📄 Row loaded:", data); // 👈 每一行
        results.push(data);
      })
      .on("end", resolve);
  });

  console.log(`📄 Loaded ${results.length} students`);
  console.log("====================================");

  // 2️⃣ 逐个处理
  for (const s of results) {
    console.log(`\n👉 Processing: ${s.email}`);

    try {
      // -------------------------
      // 查课程
      // -------------------------
      const course = await Course.findOne({
        where: { code: s.courseCode },
      });

      if (!course) {
        console.log(`❌ Course not found: ${s.courseCode}`);
        continue;
      }

      console.log(`✅ Course found: id=${course.id}, code=${course.code}`);

      // -------------------------
      // 查用户
      // -------------------------
      let user = await User.findOne({
        where: { email: s.email },
      });

      // -------------------------
      // 创建用户（如果不存在）
      // -------------------------
      if (!user) {
        console.log("👤 User not found → creating...");
        const hash = await bcrypt.hash(s.studentId, 8);

        user = await User.create({
          name: s.name,
          email: s.email,
          passwordHash: hash,
          role: "student",
          studentId: s.studentId, // ✅ 注意这里
        });

        console.log(`✅ User created: id=${user.id}`);
      } else {
        console.log(`⚠️ User exists: id=${user.id}`);
      }

      // -------------------------
      // 创建 Enrollment
      // -------------------------

      console.log("🔗 Creating enrollment:", {
        userId: user.id,
        courseId: course.id,
      });

      const [enrollment, created] = await Enrollment.findOrCreate({
        where: {
          userId: user.id, // ✅ 小写！
          courseId: course.id,
        },
      });

      if (created) {
        console.log("✅ Enrollment CREATED");
      } else {
        console.log("⚠️ Enrollment already exists");
      }

      console.log("🎯 Done for this student");
    } catch (err) {
      console.log("❌ ERROR processing student:", s.email);
      console.log("   👉", err.message);
    }
    console.log("------------------------------------");
  }

  console.log("\n🎉 DONE!");
}

importStudents();
