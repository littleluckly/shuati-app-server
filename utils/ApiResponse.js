// utils/ApiResponse.js
class ApiResponse {
  constructor(success, data, message) {
    this.success = success;
    this.data = data;
    this.message = message;
  }

  static success(data = null, message = "操作成功") {
    return new ApiResponse(true, data, message);
  }

  static error(message = "服务器错误", success = false) {
    return new ApiResponse(success, null, message);
  }
}

module.exports = ApiResponse;
