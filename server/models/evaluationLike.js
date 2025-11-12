// server/models/evaluationLike.js
module.exports = (sequelize, DataTypes) => {
  const EvaluationLike = sequelize.define("EvaluationLike", {
    // 不需要额外自定义字段，Sequelize 会自动生成 id / createdAt / updatedAt
    evaluationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  EvaluationLike.associate = (models) => {
    EvaluationLike.belongsTo(models.Evaluation, {
      foreignKey: "evaluationId",
      onDelete: "CASCADE",
    });
    EvaluationLike.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  return EvaluationLike;
};
