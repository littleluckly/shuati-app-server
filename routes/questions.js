// routes/questions.js
const express = require("express");
const router = express.Router();
const {
  getRandomQuestion,
  getRandomQuestionList,
  getFilteredQuestionList,
  getQuestionById,
  createQuestion,
  updateQuestion,
  exportQuestions,
  getManagementQuestionList,
  downloadAudioFile,
} = require("../controllers/questionController");

router.get("/random", getRandomQuestion);
router.post("/random-list", getRandomQuestionList);
router.post("/list", getFilteredQuestionList);
router.post("/", createQuestion); // 新增题目
router.put("/:id", updateQuestion); // 编辑题目
router.get("/:id", getQuestionById);
router.post("/export", exportQuestions); // 导出题目

// 管理端题目相关路由
router.post("/mgt/list", getManagementQuestionList);

// 音频文件下载接口
router.get("/audio/download/:fileName", downloadAudioFile);

module.exports = router;
