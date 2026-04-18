// server/models/evaluationRequest.js
module.exports = (sequelize, DataTypes) => {
  const EvaluationRequest = sequelize.define("EvaluationRequest", {
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // ⭐ 新增（核心）
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true, // ⚠️ 先允许 null（后面再改 NOT NULL）
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    requesteeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed"),
      defaultValue: "pending",
    },
  });

  EvaluationRequest.associate = (models) => {
    EvaluationRequest.belongsTo(models.Team, {
      foreignKey: "teamId",
      onDelete: "CASCADE",
    });

    EvaluationRequest.belongsTo(models.User, {
      as: "Requester",
      foreignKey: "requesterId",
      onDelete: "CASCADE",
    });

    EvaluationRequest.belongsTo(models.User, {
      as: "Requestee",
      foreignKey: "requesteeId",
      onDelete: "CASCADE",
    });
  };

  return EvaluationRequest;
};
