module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define("Course", {
    title: DataTypes.STRING,
    code: DataTypes.STRING,
    joinToken: DataTypes.STRING,
    description: { type: DataTypes.TEXT, allowNull: true },
    aiEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  });

  Course.associate = (models) => {
    Course.belongsTo(models.User, {
      as: "instructor",
      foreignKey: "instructorId",
      onDelete: "CASCADE",
    });
    Course.hasMany(models.Enrollment, { 
      foreignKey: "courseId",
      onDelete: "CASCADE",
      hooks: true, 
    });
    Course.hasMany(models.Team, { 
      foreignKey: "courseId",
      onDelete: "CASCADE",
      hooks: true, 
    });
  };

  return Course;
};
