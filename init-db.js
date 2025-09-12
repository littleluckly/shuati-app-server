// init-db.js
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// 👇 修改成你的数据库信息
const uri = "mongodb://127.0.0.1:27017";
// 注意：密码中有 @ 要写成 %40

// 读取 questions-meta 目录下的 JSON 文件
function loadQuestionsFromMeta() {
  const metaDir = path.join(__dirname, "raw-assets/questions-meta");
  const questions = [];

  // 确保目录存在
  if (!fs.existsSync(metaDir)) {
    console.log(`⚠️  目录不存在: ${metaDir}`);
    return questions;
  }

  // 读取目录下所有 .json 文件
  const files = fs
    .readdirSync(metaDir)
    .filter((file) => file.endsWith(".json"));

  console.log(`📁 找到 ${files.length} 个 JSON 文件`);

  for (const file of files) {
    const filePath = path.join(metaDir, file);
    try {
      const metaData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      questions.push(metaData);
    } catch (error) {
      console.error(`❌ 读取文件失败: ${file}`, error.message);
    }
  }

  return questions;
}

// 从题目数据中提取并去重标签
function extractTagsFromQuestions(questions) {
  const tagValues = new Set();
  const tagMap = new Map();

  // 从所有题目中提取标签
  questions.forEach((question) => {
    if (question.tags && Array.isArray(question.tags)) {
      question.tags.forEach((tag) => {
        // 标签格式可能是字符串或对象
        if (typeof tag === "string") {
          // 将字符串标签转换为对象格式并进行规范化
          const normalizedTag = {
            name: tag.charAt(0).toUpperCase() + tag.slice(1), // 首字母大写
            value: tag.toLowerCase(),
          };
          tagValues.add(normalizedTag.value);
          tagMap.set(normalizedTag.value, normalizedTag.name);
        } else if (typeof tag === "object" && tag.value) {
          // 如果已经是对象格式，确保 name 和 value 存在
          const normalizedTag = {
            name:
              tag.name ||
              tag.value.charAt(0).toUpperCase() + tag.value.slice(1),
            value: tag.value.toLowerCase(),
          };
          tagValues.add(normalizedTag.value);
          tagMap.set(normalizedTag.value, normalizedTag.name);
        }
      });
    }
  });

  // 转换为所需的标签数组格式
  return Array.from(tagValues)
    .map((value) => ({
      name: tagMap.get(value),
      value,
    }))
    .sort((a, b) => a.name.localeCompare(b.name)); // 按名称排序
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

    // 1. 先加载题目数据，用于提取标签
    const questionsFromMeta = loadQuestionsFromMeta();
    console.log(`📊 总共加载 ${questionsFromMeta.length} 道题目`);

    // 2. 从题目数据中提取并去重标签
    const extractedTags = extractTagsFromQuestions(questionsFromMeta);
    console.log(`🏷️  提取并去重后得到 ${extractedTags.length} 个标签`);

    // 3. 插入科目（使用从题目中提取的标签）
    const subjects = [
      {
        name: "前端开发面试",
        code: "FE_INTERVIEW",
        description: "涵盖 JS、CSS、Vue、React 等",
        tags: extractedTags,
        userTags: [], // 用户自定义标签数组
        difficultyLevels: [
          { name: "简单", value: "easy" },
          { name: "中等", value: "medium" },
          { name: "困难", value: "hard" },
        ],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await db.collection("subjects").insertMany(subjects);
    console.log("📌 已插入科目数据");

    // 4. 为每个题目添加 subjectId，使用 subjects[0]._id
    const questions = questionsFromMeta.map((question) => ({
      ...question,
      subjectId: subjects[0]._id,
      isEnabled: true, // 添加启用状态字段
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (questions.length > 0) {
      await db.collection("questions").insertMany(questions);
      console.log(`📌 已插入 ${questions.length} 道题目数据`);
    } else {
      console.log("⚠️  没有加载到题目数据，未插入题目");
    }

    // 5. 创建用户集合和添加默认用户
    const usersCollection = db.collection('users');
    
    // 检查是否已存在默认的管理员用户
    const existingAdmin = await usersCollection.findOne({ username: 'admin' });
    if (!existingAdmin) {
      // 添加默认的管理员用户（密码：admin123，实际环境应使用加密密码）
      await usersCollection.insertOne({
        username: 'admin',
        password: 'admin123', // 注意：实际环境必须使用加密存储
        role: 'admin',
        email: 'admin@example.com', // 默认管理员邮箱
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('👤 已添加默认管理员用户');
    } else {
      // 如果存在管理员用户但没有email字段，添加email字段
      if (!existingAdmin.email) {
        await usersCollection.updateOne(
          { _id: existingAdmin._id },
          { $set: { email: 'admin@example.com', updatedAt: new Date() } }
        );
        console.log('🔧 已更新管理员用户，添加email字段');
      }
    }
    
    // 其他集合会在用户使用时自动创建（如 userActions, userSettings）

    // 创建索引以提高查询性能
    console.log(".CreateIndexes...");
    // 为题目集合创建索引
    await db.collection("questions").createIndex({ subjectId: 1 });
    await db.collection("questions").createIndex({ difficulty: 1 });
    await db.collection("questions").createIndex({ tags: 1 });
    await db.collection("questions").createIndex({ createdAt: -1 }); // 用于排序
    await db
      .collection("questions")
      .createIndex({ subjectId: 1, difficulty: 1 });
    await db.collection("questions").createIndex({ subjectId: 1, tags: 1 });

    // 为用户集合创建索引
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ role: 1 });
    
    // 为用户行为集合创建索引
    await db.collection("userActions").createIndex({ userId: 1 });
    await db.collection("userActions").createIndex({ questionId: 1 });
    await db.collection("userActions").createIndex({ action: 1 });
    await db.collection("userActions").createIndex({ userId: 1, action: 1 });
    await db
      .collection("userActions")
      .createIndex({ userId: 1, questionId: 1, action: 1 });
    console.log("✅ 索引创建完成");

    console.log("🎉 数据库初始化完成！");
  } finally {
    await client.close();
  }
}

initDB().catch(console.error);
