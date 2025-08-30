// init-db.js
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// 👇 修改成你的数据库信息
const uri = "mongodb://127.0.0.1:27017";
// 注意：密码中有 @ 要写成 %40

// 读取 meta.json 文件并转换为 question 数据
function loadQuestionsFromMeta() {
  const metaDir = path.join(__dirname, "raw-assets/meta");
  const questions = [];

  // 读取目录下所有 meta.json 文件
  const files = fs
    .readdirSync(metaDir)
    .filter((file) => file.endsWith("_meta.json"));

  for (const file of files) {
    const filePath = path.join(metaDir, file);
    const metaData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // 将 meta 数据转换为 question 格式
    const question = {
      ...metaData,
      // 注意：subjectId 将在插入时设置
    };

    questions.push(question);
  }

  return questions;
}

async function initDB() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ 连接 MongoDB 成功！");

    const db = client.db("shuati");

    // 清空现有数据（可选）
    console.log("🧽 清理现有数据...");
    await db.collection("questions").deleteMany({});
    await db.collection("subjects").deleteMany({});
    console.log("✅ 数据清理完成");

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
        userTags: [], // 用户自定义标签数组
        difficultyLevels: ["简单", "中等", "困难"],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await db.collection("subjects").insertMany(subjects);
    console.log("📌 已插入科目数据");

    // 2. 从 meta.json 文件中加载题目数据
    const questionsFromMeta = loadQuestionsFromMeta();

    // 为每个题目添加 subjectId，使用 subjects[0]._id
    const questions = questionsFromMeta.map((question) => ({
      ...question,
      subjectId: subjects[0]._id,
      isEnabled: true, // 添加启用状态字段
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (questions.length > 0) {
      await db.collection("questions").insertMany(questions);
      console.log(
        `📌 已插入 ${questions.length} 道题目数据（从 meta.json 文件加载）`
      );
    } else {
      console.log("⚠️  未找到 meta.json 文件，没有插入题目数据");
    }

    // 其他集合会在用户使用时自动创建（如 userActions, userSettings）

    console.log("🎉 数据库初始化完成！");
  } finally {
    await client.close();
  }
}

initDB().catch(console.error);
