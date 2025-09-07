// controllers/userActionController.js
const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const { ObjectId } = require("mongodb");

// POST /user-actions
// 接口用途：记录用户对题目的操作行为（收藏/删除）
// 使用场景：当用户收藏或删除题目时调用此接口
// 参数说明：
// - userId: 用户ID，默认为"guest"
// - questionId: 题目ID，必填
// - action: 操作类型，可选值为"favorited"（收藏）或"deleted"（删除）
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
    questionId: new ObjectId(questionId),
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
// 接口用途：获取用户的操作统计信息
// 使用场景：在用户个人中心或统计页面显示用户收藏和删除的题目数量
// 参数说明：
// - userId: 用户ID，默认为"guest"
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

// POST /user-actions/reset-deleted (Development only)
// 接口用途：重置用户删除的题目记录（仅开发环境可用）
// 使用场景：开发和测试时清空用户的删除记录，方便测试
// 参数说明：
// - userId: 用户ID，默认为"guest"
exports.resetDeletedQuestions = async (req, res, next) => {
  const { userId = "guest" } = req.body;

  // Only allow this endpoint in development environment
  if (process.env.NODE_ENV === "production") {
    return res
      .status(403)
      .json(ApiResponse.error("Forbidden: Development endpoint only"));
  }

  try {
    const db = await connectDB();

    // Delete all "deleted" actions for the specified user
    const result = await db.collection("userActions").deleteMany({
      userId,
      action: "deleted",
    });

    res.json(
      ApiResponse.success(null, `成功重置 ${result.deletedCount} 条删除记录`)
    );
  } catch (err) {
    next(err);
  }
};

// POST /user-actions/undelete
// 接口用途：恢复用户删除的题目
// 使用场景：当用户想要恢复之前删除的题目时使用，支持单个或批量恢复
// 参数说明：
// - userId: 用户ID，默认为"guest"
// - questionIds: 要恢复的题目ID或ID数组，必填
exports.undeleteQuestions = async (req, res, next) => {
  const { userId = "guest", questionIds } = req.body;

  if (
    !questionIds ||
    (Array.isArray(questionIds) && questionIds.length === 0)
  ) {
    return res.status(400).json(ApiResponse.error("缺少必要参数: questionIds"));
  }

  const questionIdArray = Array.isArray(questionIds)
    ? questionIds
    : [questionIds];

  try {
    const db = await connectDB();

    // Delete "deleted" actions for the specified user and questions
    const result = await db.collection("userActions").deleteMany({
      userId,
      action: "deleted",
      questionId: { $in: questionIdArray.map((id) => new ObjectId(id)) },
    });

    res.json(
      ApiResponse.success(null, `成功恢复 ${result.deletedCount} 道题目`)
    );
  } catch (err) {
    next(err);
  }
};

// POST /user-actions/deleted-questions
// 接口用途：获取用户删除的题目列表，支持分页
// 使用场景：在用户"已删除"页面展示用户删除的题目列表
// 参数说明：
// - userId: 用户ID，默认为"guest"
// - page: 页码，默认为1
// - limit: 每页数量，默认为20
exports.getDeletedQuestions = async (req, res, next) => {
  const { userId = "guest", page = 1, limit = 20 } = req.body;

  try {
    const db = await connectDB();

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count of deleted questions for this user
    const total = await db.collection("userActions").countDocuments({
      userId,
      action: "deleted",
    });

    // Get paginated deleted questions with question details
    const pipeline = [
      { $match: { userId, action: "deleted" } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: "questions",
          localField: "questionId",
          foreignField: "_id",
          as: "questionDetails",
        },
      },
      {
        $unwind: "$questionDetails",
      },
      { $project: {
          _id: 1,
          userId: 1,
          questionId: 1,
          action: 1,
          createdAt: 1,
          "questionDetails._id": 1,
          "questionDetails.id": 1,
          "questionDetails.type": 1,
          "questionDetails.difficulty": 1,
          "questionDetails.tags": 1,
          "questionDetails.question_markdown": 1,
          "questionDetails.answer_simple_markdown": 1,
          "questionDetails.answer_detail_markdown": 1,
          "questionDetails.answer_analysis_markdown": 1,
          "questionDetails.audioKey": 1,
          "questionDetails.files": 1,
          "questionDetails.subjectId": 1,
        },
      },
    ];

    const deletedQuestions = await db
      .collection("userActions")
      .aggregate(pipeline)
      .toArray();

    const result = {
      questions: deletedQuestions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    };

    res.json(ApiResponse.success(result));
  } catch (err) {
    next(err);
  }
};
