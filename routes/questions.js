// routes/questions.js
const express = require("express");
const router = express.Router();
const { getRandomQuestion } = require("../controllers/questionController");

router.get("/random", getRandomQuestion);

module.exports = router;
