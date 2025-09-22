// routes/userActions.js
const express = require("express");
const router = express.Router();
const {
  recordUserAction,
  getUserStats,
  resetDeletedQuestions,
  undeleteQuestions,
  getDeletedQuestions,
  selectSubject,
  getCurrentSubject,
  setAudioPreferences,
  getAudioPreferences
} = require("../controllers/userActionsController");

// 记录用户对题目的操作行为（收藏/删除）
router.post("/", recordUserAction);

// 获取用户的操作统计信息
router.get("/stats", getUserStats);

// 重置用户删除的题目记录（仅开发环境可用）
router.post("/reset-deleted", resetDeletedQuestions);

// 恢复用户删除的题目
router.post("/undelete", undeleteQuestions);

// 获取用户删除的题目列表，支持分页
router.post("/deleted-questions", getDeletedQuestions);

// 记录用户选择的科目
router.post("/select-subject", selectSubject);

// 获取用户当前选择的科目
router.get("/current-subject", getCurrentSubject);

// 设置用户的音频播放偏好
router.post("/set-audio-preferences", setAudioPreferences);

// 获取用户的音频播放偏好
router.get("/audio-preferences", getAudioPreferences);

module.exports = router;
