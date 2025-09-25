// utils/ApiResponse.js
class ApiResponse {
  constructor(success, data, message, meta = null) {
    this.success = success;
    this.data = data;
    this.message = message;
    // 只有当meta存在时才添加到响应中
    if (meta) {
      this.meta = meta;
    }
  }

  static success(data = null, message = "操作成功", meta = null) {
    return new ApiResponse(true, data, message, meta);
  }

  static error(message = "服务器错误", success = false) {
    return new ApiResponse(success, null, message);
  }
}

module.exports = ApiResponse;
