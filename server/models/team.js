module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define("Team", {
    name: DataTypes.STRING,
  });

  Team.associate = (models) => {
    Team.belongsTo(models.Course, {
      foreignKey: "courseId",
      onDelete: "CASCADE",
    });

    Team.hasMany(models.TeamMembership, {
      foreignKey: "teamId",
      onDelete: "CASCADE",
      hooks: true,
    });

    Team.hasMany(models.Evaluation, {
      foreignKey: "teamId",
      onDelete: "CASCADE",
      hooks: true,
    });

    Team.hasMany(models.EvaluationRequest, {
      foreignKey: "teamId",
      onDelete: "CASCADE",
      hooks: true,
    });
  };

  return Team;
};