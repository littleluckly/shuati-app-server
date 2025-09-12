const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getUserInfo,
  forgotPassword,
  resetPassword
} = require("../controllers/userController");

// 用户注册接口
router.post("/register", register);

// 用户登录接口
router.post("/login", login);

// 用户退出登录接口
router.post("/logout", logout);

// 获取用户信息接口
router.get("/info", getUserInfo);

// 忘记密码接口
router.post("/forgot-password", forgotPassword);

// 重置密码接口
router.post("/reset-password", resetPassword);

module.exports = router;