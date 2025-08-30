// init-db.js
const { MongoClient } = require("mongodb");

// 👇 修改成你的数据库信息
const uri = "mongodb://127.0.0.1:27017";
// 注意：密码中有 @ 要写成 %40

async function initDB() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ 连接 MongoDB 成功！");

    const db = client.db("shuati");

    // 1. 插入科目
    const subjects = [
      {
        name: "前端开发面试",
        code: "FE_INTERVIEW",
        description: "涵盖 JS、CSS、Vue、React 等",
        tags: [
          { name: "JavaScript", type: "language" },
          { name: "CSS", type: "style" },
          { name: "React", type: "framework" },
          { name: "Vue", type: "framework" },
          { name: "工程化", type: "tooling" },
        ],
        difficultyLevels: ["简单", "中等", "困难"],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await db.collection("subjects").insertMany(subjects);
    console.log("📌 已插入科目数据");

    // 2. 插入题目（示例）
    const questions = [
      {
        subjectId: subjects[0]._id,
        title: "请解释闭包的概念",
        content: "JavaScript 中的闭包是指函数可以访问其外部作用域的变量。",
        difficulty: "中等",
        tags: ["JavaScript", "概念"],
        audio: {
          question: { default: "" },
          answerBrief: { default: "" },
          answerDetailed: { default: "" },
        },
        defaultAnswer: {
          brief: "闭包是函数和其词法环境的组合。",
          detailed: "详细解释：闭包允许函数记住并访问其外部作用域...",
        },
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await db.collection("questions").insertMany(questions);
    console.log("📌 已插入题目数据");

    // 其他集合会在用户使用时自动创建（如 userActions, userSettings）

    console.log("🎉 数据库初始化完成！");
  } finally {
    await client.close();
  }
}

initDB().catch(console.error);
