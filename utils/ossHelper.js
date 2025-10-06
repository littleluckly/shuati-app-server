const OSS = require("ali-oss");
const ossConfig = require("../config/ossConfig");
const logger = require("./logger");

// OSS客户端单例实例
let ossClientInstance = null;

// 初始化OSS客户端（单例模式）
function initOSSClient() {
  try {
    // 如果已经有有效实例，直接返回
    if (ossClientInstance) {
      return ossClientInstance;
    }

    // 首次创建实例
    ossClientInstance = new OSS(ossConfig);
    logger.info("OSS客户端初始化成功");
    return ossClientInstance;
  } catch (error) {
    logger.error("OSS客户端初始化失败", error);
    throw new Error("OSS客户端初始化失败");
  }
}

// 下载OSS文件到本地临时路径
async function downloadOSSFile(client, ossFilePath, localFilePath) {
  try {
    await client.get(ossFilePath, localFilePath);
    logger.info(`OSS文件下载成功: ${ossFilePath} -> ${localFilePath}`);
    return localFilePath;
  } catch (error) {
    logger.error(`OSS文件下载失败: ${ossFilePath}`, error);
    throw new Error(`OSS文件下载失败: ${error.message}`);
  }
}

// 流式下载OSS文件
async function streamOSSFile(client, ossFilePath) {
  try {
    const stream = await client.getStream(ossFilePath);
    logger.info(`OSS文件流式获取成功: ${ossFilePath}`);
    return stream;
  } catch (error) {
    logger.error(`OSS文件流式获取失败: ${ossFilePath}`, error);
    throw new Error(`OSS文件流式获取失败: ${error.message}`);
  }
}

// 检查文件是否存在
async function checkOSSFileExists(client, ossFilePath) {
  try {
    await client.head(ossFilePath);
    return true;
  } catch (error) {
    if (error.code === "NoSuchKey") {
      return false;
    }
    throw error;
  }
}

module.exports = {
  initOSSClient,
  downloadOSSFile,
  streamOSSFile,
  checkOSSFileExists,
};
