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
});
