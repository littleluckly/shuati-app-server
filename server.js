// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use("/subjects", require("./routes/subjects"));
app.use("/questions", require("./routes/questions"));
app.use("/user-actions", require("./routes/userActions"));
app.use("/users", require("./routes/users"));

// 根路径测试
app.get("/", (req, res) => {
  res.json({ message: "题库 API 服务运行中！" });
});

// 错误处理中间件
app.use(require("./middleware/errorHandler"));

// 启动服务
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 服务已启动：http://0.0.0.0:${port}`);
  console.log(`📘 API 文档：`);
  console.log(`   GET  /subjects`);
  console.log(`   GET  /subjects/all`);
  console.log(`   GET  /subjects/:id`);
  console.log(`   GET  /subjects/:id/tags-count`);
  console.log(`   POST /subjects/:id/user-tags`);
  console.log(`   PUT  /subjects/:id/user-tags/:tagName`);
  console.log(`   DELETE /subjects/:id/user-tags/:tagName`);
  console.log(`   GET  /questions/random?subjectId=&difficulty=`);
  console.log(`   POST /questions/random-list`);
  console.log(`   POST /questions/list`);
  console.log(`   GET  /questions/:id`);
  // 用户行为相关API
  console.log(`   POST /user-actions`);
  console.log(`   GET  /user-actions/stats?userId=`);
  console.log(`   POST /user-actions/reset-deleted`);
  console.log(`   POST /user-actions/undelete`);
  console.log(`   POST /user-actions/deleted-questions`);
  console.log(`   POST /user-actions/select-subject`);
  console.log(`   GET  /user-actions/current-subject?userId=`);
  // 用户管理相关API
  console.log(`   POST /users/register`);
  console.log(`   POST /users/login`);
  console.log(`   POST /users/logout`);
  console.log(`   GET  /users/info?token=`);
  console.log(`   POST /users/forgot-password`);
  console.log(`   POST /users/reset-password`);
});
