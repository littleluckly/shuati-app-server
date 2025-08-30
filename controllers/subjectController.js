// controllers/subjectController.js
const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");

// GET /subjects
exports.getSubjects = async (req, res, next) => {
  try {
    const db = await connectDB();
    const subjects = await db
      .collection("subjects")
      .find({ isEnabled: true })
      .toArray();
    res.json(ApiResponse.success(subjects));
  } catch (err) {
    next(err);
  }
};

// GET /subjects/:id
exports.getSubjectById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const db = await connectDB();
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new require("mongodb").ObjectId(id) });
    if (!subject) {
      return res.status(404).json(ApiResponse.error("科目不存在"));
    }
    res.json(ApiResponse.success(subject));
  } catch (err) {
    next(err);
  }
};
