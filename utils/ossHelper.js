const OSS = require("ali-oss");
const ossConfig = require("../config/ossConfig");
const logger = require("./logger");
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

// OSS客户端单例实例
let ossClientInstance = null;

// 缓存配置
const CACHE_CONFIG = {
  // 缓存目录
  directory: path.join(__dirname, '../cache/oss'),
  // 缓存过期时间（单位：小时）
  expiryHours: 24,
  // 最大缓存大小（单位：MB）
  maxSizeMB: 100,
};

// 缓存状态记录
let cacheStats = {
  totalSize: 0, // 当前缓存总大小（字节）
  fileCount: 0, // 缓存文件数量
  lastCleanup: Date.now() // 上次清理时间
};

// 缓存文件信息映射
const cachedFiles = new Map();

// 初始化缓存目录
async function initCacheDirectory() {
  try {
    // 确保缓存目录存在
    await fsPromises.mkdir(CACHE_CONFIG.directory, { recursive: true });
    logger.info(`缓存目录初始化成功: ${CACHE_CONFIG.directory}`);
  } catch (error) {
    logger.error(`缓存目录初始化失败: ${error.message}`);
  }
}

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
    
    // 初始化缓存目录（异步执行，不阻塞主流程）
    initCacheDirectory().catch(err => {
      logger.error(`缓存初始化失败: ${err.message}`);
    });
    
    return ossClientInstance;
  } catch (error) {
    logger.error("OSS客户端初始化失败", error);
    throw new Error("OSS客户端初始化失败");
  }
}

// 获取缓存文件的本地路径
function getCacheFilePath(ossFilePath) {
  // 生成安全的文件名
  const safeFileName = ossFilePath
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .replace(/\/+/g, '_');
  return path.join(CACHE_CONFIG.directory, safeFileName);
}

// 检查文件是否在缓存中且有效
async function isFileCached(ossFilePath) {
  const cacheFilePath = getCacheFilePath(ossFilePath);
  
  try {
    // 检查缓存文件是否存在
    const stats = await fsPromises.stat(cacheFilePath);
    const now = Date.now();
    const fileInfo = cachedFiles.get(ossFilePath);
    
    // 检查文件是否过期
    const isExpired = stats.mtimeMs < now - (CACHE_CONFIG.expiryHours * 60 * 60 * 1000);
    
    if (isExpired) {
      logger.info(`缓存文件已过期: ${ossFilePath}`);
      // 从缓存中删除过期文件
      await fsPromises.unlink(cacheFilePath);
      cachedFiles.delete(ossFilePath);
      cacheStats.totalSize -= stats.size;
      cacheStats.fileCount -= 1;
      return false;
    }
    
    // 更新访问时间
    cachedFiles.set(ossFilePath, {
      ...fileInfo,
      lastAccessed: now
    });
    
    return true;
  } catch (error) {
    // 文件不存在或其他错误
    return false;
  }
}

// 从缓存中读取文件流
function readFileFromCache(ossFilePath) {
  const cacheFilePath = getCacheFilePath(ossFilePath);
  const fileStream = fs.createReadStream(cacheFilePath);
  logger.info(`从缓存读取文件: ${ossFilePath}`);
  return fileStream;
}

// 将文件保存到缓存
async function saveFileToCache(ossFilePath, fileStream) {
  const cacheFilePath = getCacheFilePath(ossFilePath);
  
  try {
    // 确保缓存目录存在
    await fsPromises.mkdir(CACHE_CONFIG.directory, { recursive: true });
    
    // 创建写入流
    const writeStream = fs.createWriteStream(cacheFilePath);
    
    // 返回Promise以便等待文件写入完成
    return new Promise((resolve, reject) => {
      let fileSize = 0;
      
      fileStream.on('data', (chunk) => {
        fileSize += chunk.length;
      });
      
      fileStream.on('end', async () => {
        try {
          // 更新缓存统计
          cacheStats.totalSize += fileSize;
          cacheStats.fileCount += 1;
          
          // 记录缓存文件信息
          cachedFiles.set(ossFilePath, {
            size: fileSize,
            created: Date.now(),
            lastAccessed: Date.now()
          });
          
          logger.info(`文件已缓存: ${ossFilePath}, 大小: ${fileSize}字节`);
          
          // 检查是否需要清理缓存
          await checkAndCleanupCache();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      fileStream.on('error', (error) => {
        // 出错时清理部分写入的文件
        fsPromises.unlink(cacheFilePath).catch(() => {});
        reject(error);
      });
      
      // 管道连接读写流
      fileStream.pipe(writeStream);
    });
  } catch (error) {
    logger.error(`缓存文件保存失败: ${ossFilePath}`, error);
    // 出错时尝试清理部分写入的文件
    try {
      await fsPromises.unlink(cacheFilePath);
    } catch (e) {}
    throw error;
  }
}

// 检查并清理缓存
async function checkAndCleanupCache() {
  const now = Date.now();
  const maxSizeBytes = CACHE_CONFIG.maxSizeMB * 1024 * 1024;
  
  // 检查是否需要进行缓存清理（定时清理或超过大小限制）
  if (cacheStats.totalSize > maxSizeBytes || 
      now - cacheStats.lastCleanup > (6 * 60 * 60 * 1000)) { // 每6小时清理一次
    
    logger.info(`开始清理缓存，当前缓存大小: ${cacheStats.totalSize/1024/1024}MB，文件数: ${cacheStats.fileCount}`);
    
    try {
      // 获取所有缓存文件信息并排序（按最后访问时间升序）
      const filesToClean = Array.from(cachedFiles.entries())
        .map(([path, info]) => ({ path, ...info }))
        .sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      // 清理直到缓存大小低于限制
      while (cacheStats.totalSize > maxSizeBytes * 0.8 && filesToClean.length > 0) {
        const oldestFile = filesToClean.shift();
        const cacheFilePath = getCacheFilePath(oldestFile.path);
        
        try {
          await fs.unlink(cacheFilePath);
          cacheStats.totalSize -= oldestFile.size;
          cacheStats.fileCount -= 1;
          cachedFiles.delete(oldestFile.path);
          logger.info(`清理缓存文件: ${oldestFile.path}, 大小: ${oldestFile.size}字节`);
        } catch (error) {
          logger.warn(`清理缓存文件失败: ${oldestFile.path}`, error);
        }
      }
      
      // 更新最后清理时间
      cacheStats.lastCleanup = now;
      
      logger.info(`缓存清理完成，清理后大小: ${cacheStats.totalSize/1024/1024}MB，文件数: ${cacheStats.fileCount}`);
    } catch (error) {
      logger.error(`缓存清理失败: ${error.message}`);
    }
  }
}

// 流式下载OSS文件（带缓存支持）
async function streamOSSFile(client, ossFilePath) {
  try {
    // 首先检查文件是否在缓存中且有效
    if (await isFileCached(ossFilePath)) {
      // 从缓存中读取文件流
      const cachedStream = readFileFromCache(ossFilePath);
      return { stream: cachedStream, fromCache: true };
    }
    
    // 缓存不存在或已过期，从OSS获取文件流
    const ossStreamResult = await client.getStream(ossFilePath);
    logger.info(`OSS文件流式获取成功: ${ossFilePath}`);
    
    // 在后台异步将文件保存到缓存（不阻塞主流程）
    saveFileToCache(ossFilePath, ossStreamResult.stream.pipe(require('stream').PassThrough()))
      .catch(err => {
        logger.warn(`文件缓存保存失败（不影响主流程）: ${ossFilePath}`, err);
      });
    
    return { stream: ossStreamResult.stream, fromCache: false };
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
  streamOSSFile,
  checkOSSFileExists,
  // 导出缓存相关函数，供外部使用或测试
  isFileCached,
  readFileFromCache,
  saveFileToCache,
  checkAndCleanupCache,
};
