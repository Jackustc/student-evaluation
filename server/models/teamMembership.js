module.exports = (sequelize, DataTypes) => {
  const TeamMembership = sequelize.define("TeamMembership", {});

  TeamMembership.associate = (models) => {
    TeamMembership.belongsTo(models.Team, {
      foreignKey: "teamId",
      onDelete: "CASCADE",
    });

    TeamMembership.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  return TeamMembership;
};