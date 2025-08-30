// config/db.js
const { MongoClient } = require("mongodb");

let db;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (db) return db;

  const client = new MongoClient(uri);
  await client.connect();
  db = client.db("shuati"); // 数据库名称
  console.log("✅ MongoDB 连接成功！");
  return db;
}

module.exports = { connectDB };
