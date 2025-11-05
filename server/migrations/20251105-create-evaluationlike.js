module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("EvaluationLikes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      evaluationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Evaluations", key: "id" },
        onDelete: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // ✅ 一个用户对一条评价只能点一次赞
    await queryInterface.addConstraint("EvaluationLikes", {
      fields: ["evaluationId", "userId"],
      type: "unique",
      name: "unique_like_per_user",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("EvaluationLikes");
  },
};
