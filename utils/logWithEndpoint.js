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
    params: req.params || {}
  };

  // 添加接口地址、请求方法和请求参数到元数据
  const enhancedMeta = {
    ...meta,
    endpoint,
    method,
    requestParams
  };
  // 调用对应的logger方法
  if (logger[level]) {
    logger[level](message, enhancedMeta);
  } else {
    logger.info(message, enhancedMeta);
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
