// middleware/errorHandler.js
const ApiResponse = require("../utils/ApiResponse");

function errorHandler(err, req, res, next) {
  console.error("🚨 服务器错误:", err.stack);
  res.status(500).json(ApiResponse.error("服务器内部错误"));
}

module.exports = errorHandler;
