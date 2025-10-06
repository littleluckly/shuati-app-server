// OSS配置信息
require("dotenv").config();

const ossConfig = {
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  endpoint: process.env.OSS_ENDPOINT,
  internal: process.env.OSS_INTERNAL === "true", // 使用内网访问
};

module.exports = ossConfig;
