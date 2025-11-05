// "use strict";
module.exports = {
  async up() {
    console.log(
      "⚠️ Skipping broken migration 20251022154757-rename-columns-to-lowercase"
    );
  },
  async down() {},
};

// module.exports = {
//   async up(queryInterface, Sequelize) {
//     // Enrollment 表
//     await queryInterface.renameColumn("Enrollments", "UserId", "userId");
//     await queryInterface.renameColumn("Enrollments", "CourseId", "courseId");

//     // TeamMemberships 表
//     await queryInterface.renameColumn("TeamMemberships", "UserId", "userId");
//     await queryInterface.renameColumn("TeamMemberships", "TeamId", "teamId");

//     // Teams 表
//     await queryInterface.renameColumn("Teams", "CourseId", "courseId");

//     // Evaluations 表
//     await queryInterface.renameColumn("Evaluations", "TeamId", "teamId");

//     // EvaluationRequests 表
//     await queryInterface.renameColumn("EvaluationRequests", "TeamId", "teamId");
//     await queryInterface.renameColumn(
//       "EvaluationRequests",
//       "RequesterId",
//       "requesterId"
//     );
//     await queryInterface.renameColumn(
//       "EvaluationRequests",
//       "RequesteeId",
//       "requesteeId"
//     );
//   },

//   async down(queryInterface, Sequelize) {
//     // 回滚时恢复原名
//     await queryInterface.renameColumn("Enrollments", "userId", "UserId");
//     await queryInterface.renameColumn("Enrollments", "courseId", "CourseId");

//     await queryInterface.renameColumn("TeamMemberships", "userId", "UserId");
//     await queryInterface.renameColumn("TeamMemberships", "teamId", "TeamId");

//     await queryInterface.renameColumn("Teams", "courseId", "CourseId");

//     await queryInterface.renameColumn("Evaluations", "teamId", "TeamId");

//     await queryInterface.renameColumn("EvaluationRequests", "teamId", "TeamId");
//     await queryInterface.renameColumn(
//       "EvaluationRequests",
//       "requesterId",
//       "RequesterId"
//     );
//     await queryInterface.renameColumn(
//       "EvaluationRequests",
//       "requesteeId",
//       "RequesteeId"
//     );
//   },
// };
