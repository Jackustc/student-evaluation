module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM("student", "instructor", "admin"),
      defaultValue: "student",
    },
    studentId: { type: DataTypes.STRING, allowNull: true },
  });

  User.associate = (models) => {
    User.hasMany(models.Course, { foreignKey: "instructorId" });
    User.hasMany(models.Enrollment, { foreignKey: "userId" });
    User.hasMany(models.TeamMembership, { foreignKey: "userId" });

    // Evaluation 关系
    User.hasMany(models.Evaluation, {
      as: "EvaluationsGiven",
      foreignKey: "evaluatorId",
    });
    User.hasMany(models.Evaluation, {
      as: "EvaluationsReceived",
      foreignKey: "evaluateeId",
    });

    // EvaluationRequest
    User.hasMany(models.EvaluationRequest, {
      as: "RequestsSent",
      foreignKey: "requesterId",
    });
    User.hasMany(models.EvaluationRequest, {
      as: "RequestsReceived",
      foreignKey: "requesteeId",
    });
    // ✅ 新增：用户与点赞的关系
    User.hasMany(models.EvaluationLike, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  return User;
};
