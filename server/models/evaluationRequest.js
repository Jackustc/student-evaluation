// server/models/evaluationRequest.js
module.exports = (sequelize, DataTypes) => {
  const EvaluationRequest = sequelize.define("EvaluationRequest", {
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    EvaluationRequest.belongsTo(models.Team, { foreignKey: "teamId" });
    EvaluationRequest.belongsTo(models.User, {
      as: "Requester",
      foreignKey: "requesterId",
    });
    EvaluationRequest.belongsTo(models.User, {
      as: "Requestee",
      foreignKey: "requesteeId",
    });
  };

  return EvaluationRequest;
};
