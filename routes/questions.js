// routes/questions.js
const express = require("express");
const router = express.Router();
const {
  getRandomQuestion,
  getRandomQuestionList,
  getFilteredQuestionList,
  getQuestionById,
} = require("../controllers/questionController");

router.get("/random", getRandomQuestion);
router.post("/random-list", getRandomQuestionList);
router.post("/list", getFilteredQuestionList);
router.get("/:id", getQuestionById);

module.exports = router;
