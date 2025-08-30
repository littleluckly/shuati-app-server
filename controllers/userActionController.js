// controllers/userActionController.js
const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");

// POST /user-actions
exports.recordUserAction = async (req, res, next) => {
  const { userId = "guest", questionId, action } = req.body;
  const validActions = ["favorited", "deleted"];

  if (!questionId || !action) {
    return res.status(400).json(ApiResponse.error("缺少必要参数"));
  }

  if (!validActions.includes(action)) {
    return res.status(400).json(ApiResponse.error("无效的行为类型"));
  }

  const actionDoc = {
    userId,
    questionId: new require("mongodb").ObjectId(questionId),
    action,
    createdAt: new Date(),
  };

  try {
    const db = await connectDB();
    await db.collection("userActions").insertOne(actionDoc);
    res.json(ApiResponse.success(null, "记录成功"));
  } catch (err) {
    next(err);
  }
};

// GET /user-actions/stats
exports.getUserStats = async (req, res, next) => {
  const { userId = "guest" } = req.query;

  try {
    const db = await connectDB();
    const stats = await db
      .collection("userActions")
      .aggregate([
        { $match: { userId } },
        { $group: { _id: "$action", count: { $sum: 1 } } },
      ])
      .toArray();

    const result = { favorited: 0, deleted: 0, total: 0 };
    stats.forEach((item) => {
      result[item._id] = item.count;
      result.total += item.count;
    });

    res.json(ApiResponse.success(result));
  } catch (err) {
    next(err);
  }
};
