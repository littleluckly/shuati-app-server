// routes/questions.js
const express = require("express");
const router = express.Router();
const {
  getRandomQuestion,
  getRandomQuestionList,
  getFilteredQuestionList,
} = require("../controllers/questionController");

router.get("/random", getRandomQuestion);
router.post("/random-list", getRandomQuestionList);
router.post("/list", getFilteredQuestionList);

module.exports = router;
