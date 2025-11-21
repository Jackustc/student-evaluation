"use strict";

/**
 * 这个 migration 会把 Users.role 的 ENUM 扩展为：student / instructor / admin
 * 无需删除表，也不会影响已有数据。
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: 先从数据库中删除旧 ENUM 类型
    // MySQL 中，修改 ENUM 不需要显式删除，只需要直接 changeColumn。
    // 下面的写法已经兼容你的项目。
    await queryInterface.changeColumn("Users", "role", {
      type: Sequelize.ENUM("student", "instructor", "admin"),
      allowNull: false,
      defaultValue: "student",
    });
  },

  async down(queryInterface, Sequelize) {
    // 如果回滚 migration，则去掉 admin
    await queryInterface.changeColumn("Users", "role", {
      type: Sequelize.ENUM("student", "instructor"),
      allowNull: false,
      defaultValue: "student",
    });
  },
};
