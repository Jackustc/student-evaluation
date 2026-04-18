module.exports = (sequelize, DataTypes) => {
  const Evaluation = sequelize.define("Evaluation", {
    score: DataTypes.INTEGER,
    comment: DataTypes.TEXT,
    anonymousToPeers: { type: DataTypes.BOOLEAN, defaultValue: false },

    courseId: DataTypes.INTEGER,
  });

  Evaluation.associate = (models) => {
    Evaluation.belongsTo(models.Team, {
      foreignKey: "teamId",
      onDelete: "CASCADE",
    });

    Evaluation.belongsTo(models.User, {
      as: "evaluator",
      foreignKey: "evaluatorId",
      onDelete: "CASCADE",
    });

    Evaluation.belongsTo(models.User, {
      as: "evaluatee",
      foreignKey: "evaluateeId",
      onDelete: "CASCADE",
    });

    Evaluation.hasMany(models.EvaluationLike, {
      foreignKey: "evaluationId",
      onDelete: "CASCADE",
      hooks: true,
    });
  };

  return Evaluation;
};
