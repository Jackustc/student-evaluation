// server/models/index.js
const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
  }
);

const db = {};

// 自动导入所有模型文件
const modelFiles = [
  "user",
  "course",
  "enrollment",
  "team",
  "teamMembership",
  "evaluation",
  "evaluationLike",
  "evaluationRequest",
  "notification",
];

for (const file of modelFiles) {
  const model = require(`./${file}`)(sequelize, DataTypes);
  db[model.name] = model;
}

// 建立关联（每个模型文件内定义 associate）
Object.keys(db).forEach((name) => {
  if (db[name].associate) db[name].associate(db);
});

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
