// controllers/questionController.js
const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");

// GET /questions/random
exports.getRandomQuestion = async (req, res, next) => {
  const { subjectId, difficulty } = req.query;
  const filter = { isEnabled: true };

  if (subjectId) filter.subjectId = new require("mongodb").ObjectId(subjectId);
  if (difficulty) filter.difficulty = difficulty;

  try {
    const db = await connectDB();
    const questions = await db
      .collection("questions")
      .aggregate([{ $match: filter }, { $sample: { size: 1 } }])
      .toArray();

    if (questions.length === 0) {
      return res.status(404).json(ApiResponse.error("暂无符合条件的题目"));
    }

    res.json(ApiResponse.success(questions[0]));
  } catch (err) {
    next(err);
  }
};
