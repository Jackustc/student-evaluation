const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./models");

const app = express();

// app.use((req, res, next) => {
//   console.log("➡️  [TRACE]", req.method, req.url);
//   next();
// });
app.use(cors());
app.use(express.json());

// route
app.use("/notifications", require("./routes/notifications"));

app.use("/auth", require("./routes/auth"));
app.use("/courses", require("./routes/courses"));
app.use("/teams", require("./routes/teams"));
app.use("/evaluation-likes", require("./routes/evaluationLikes"));
app.use("/", require("./routes/evaluationRequests"));
app.use("/", require("./routes/evaluations"));
app.use("/ai", require("./routes/ai"));
const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

// connect db and strat
db.sequelize.sync({ alter: false }).then(() => {
  app.listen(process.env.PORT || 3001, () => {
    console.log(`✅ Server running on port ${process.env.PORT || 3001}`);
  });
});
