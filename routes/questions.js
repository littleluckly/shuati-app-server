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
} = require("../controllers/questionController");

router.get("/random", getRandomQuestion);
router.post("/random-list", getRandomQuestionList);
router.post("/list", getFilteredQuestionList);
router.post("/", createQuestion); // 新增题目
router.put("/:id", updateQuestion); // 编辑题目
router.get("/:id", getQuestionById);

module.exports = router;
