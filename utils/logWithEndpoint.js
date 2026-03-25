const logger = require("./logger");

/**
 * 带接口地址的日志记录函数
 * @param {Object} req - Express 请求对象
 * @param {string} level - 日志级别 (info, error, warn, debug)
 * @param {string} message - 日志消息
 * @param {Object} meta - 元数据对象
 * @returns {void}
 */
function logWithEndpoint(req, level, message, meta = {}) {
  const endpoint = req.originalUrl || req.path;
  const method = req.method;

  // 提取请求参数
  const requestParams = {
    query: req.query || {},
    body: req.body || {},
    params: req.params || {},
  };

  // 添加接口地址、请求方法和请求参数到元数据
  const enhancedMeta = {
    ...meta,
    endpoint,
    method,
    requestParams,
  };

  // 在日志消息开头增加时间（东八区格式）
  const now = new Date();
  const utc8Time = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = utc8Time.getUTCFullYear();
  const month = String(utc8Time.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc8Time.getUTCDate()).padStart(2, "0");
  const hours = String(utc8Time.getUTCHours()).padStart(2, "0");
  const minutes = String(utc8Time.getUTCMinutes()).padStart(2, "0");
  const seconds = String(utc8Time.getUTCSeconds()).padStart(2, "0");
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  const messageWithTime = `[${timestamp}] ${message}`;

  // 调用对应的logger方法
  if (logger[level]) {
    logger[level](messageWithTime, enhancedMeta);
  } else {
    logger.info(messageWithTime, enhancedMeta);
  }
}

// 创建便捷的方法
const logHelper = {
  info: (req, message, meta) => logWithEndpoint(req, "info", message, meta),
  error: (req, message, meta) => logWithEndpoint(req, "error", message, meta),
  warn: (req, message, meta) => logWithEndpoint(req, "warn", message, meta),
  debug: (req, message, meta) => logWithEndpoint(req, "debug", message, meta),
};

module.exports = logHelper;
