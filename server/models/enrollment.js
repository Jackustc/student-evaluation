module.exports = (sequelize, DataTypes) => {
  const Enrollment = sequelize.define("Enrollment", {});

  Enrollment.associate = (models) => {
    Enrollment.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });

    Enrollment.belongsTo(models.Course, {
      foreignKey: "courseId",
      onDelete: "CASCADE",
    });
  };

  return Enrollment;
};