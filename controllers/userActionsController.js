const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const { ObjectId } = require("mongodb");
const logHelper = require('../utils/logWithEndpoint');

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
    logHelper.error(req, "【参数验证错误】缺少必要参数", { userId, questionId, action });
    return res.status(400).json(ApiResponse.error("缺少必要参数"));
  }

  if (!validActions.includes(action)) {
    logHelper.error(req, "【参数验证错误】无效的行为类型", { action });
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
    logHelper.info(req, "【业务逻辑信息】用户行为记录成功", { userId, questionId, action });
    res.json(ApiResponse.success(null, "记录成功"));
  } catch (err) {
    logHelper.error(req, "【系统错误】记录用户行为失败", err);
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

    logHelper.info(req, "【业务逻辑信息】获取用户统计信息成功", { userId });
    res.json(ApiResponse.success(result));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取用户统计信息失败", err);
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
    logHelper.error(req, "【业务逻辑错误】该接口仅在开发环境可用");
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

    logHelper.info(req, "【业务逻辑信息】成功重置用户删除的题目记录", { userId, resetCount: result.deletedCount });
    res.json(
      ApiResponse.success(null, `成功重置 ${result.deletedCount} 条删除记录`)
    );
  } catch (err) {
    logHelper.error(req, "【系统错误】重置用户删除的题目记录失败", err);
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
    logHelper.error(req, "【参数验证错误】缺少必要参数: questionIds", { userId });
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

    logHelper.info(req, "【业务逻辑信息】成功恢复用户删除的题目", { userId, restoredCount: result.deletedCount });
    res.json(
      ApiResponse.success(null, `成功恢复 ${result.deletedCount} 道题目`)
    );
  } catch (err) {
    logHelper.error(req, "【系统错误】恢复用户删除的题目失败", err);
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
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  try {
    const db = await connectDB();

    // 获取用户删除的题目ID列表
    const deletedActions = await db
      .collection("userActions")
      .find(
        {
          userId,
          action: "deleted",
        },
        {
          projection: { questionId: 1 },
          limit: limitNum,
          skip: skip,
        }
      )
      .toArray();

    // 获取总条数用于分页
    const total = await db.collection("userActions").countDocuments({
      userId,
      action: "deleted",
    });

    // 如果没有删除的题目，直接返回空列表
    if (deletedActions.length === 0) {
      logHelper.info(req, "【业务逻辑信息】用户没有删除的题目", { userId, page: pageNum, limit: limitNum });
      return res.json(
        ApiResponse.success({
          questions: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1,
          },
        })
      );
    }

    // 获取题目详情
    const questionIds = deletedActions.map((action) => action.questionId);
    const questions = await db
      .collection("questions")
      .find({
        _id: { $in: questionIds },
      })
      .toArray();

    // 构建返回结果，包含用户操作信息和题目详情
    const result = {
      questions: deletedActions.map((action) => {
        const questionDetails = questions.find(
          (q) => q._id.toString() === action.questionId.toString()
        );
        return {
          ...action,
          questionDetails,
        };
      }),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    };

    logHelper.info(req, "【业务逻辑信息】获取用户删除的题目列表成功", { userId, page: pageNum, limit: limitNum, total });
    res.json(ApiResponse.success(result));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取用户删除的题目列表失败", err);
    next(err);
  }
};

// POST /user-actions/select-subject
// 接口用途：记录用户选择的科目
// 使用场景：当用户切换科目时调用此接口
// 参数说明：
// - userId: 用户ID，默认为"guest"
// - subjectId: 科目ID，必填
exports.selectSubject = async (req, res, next) => {
  const { userId = "guest", subjectId } = req.body;

  if (!subjectId) {
    logHelper.error(req, "【参数验证错误】缺少必要参数: subjectId", { userId });
    return res.status(400).json(ApiResponse.error("缺少必要参数: subjectId"));
  }

  try {
    const db = await connectDB();

    // 首先验证科目是否存在
    const subject = await db.collection("subjects").findOne({
      _id: new ObjectId(subjectId),
    });

    if (!subject) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { subjectId });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 更新或插入用户选择的科目记录
    const result = await db.collection("userActions").updateOne(
      {
        userId,
        action: "selected_subject",
      },
      {
        $set: {
          subjectId: new ObjectId(subjectId),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    );

    const message = 
      result.upsertedCount > 0
        ? "科目选择记录创建成功"
        : "科目选择记录更新成功";
        
    logHelper.info(req, "【业务逻辑信息】用户选择科目成功", { userId, subjectId, subjectName: subject.name });
    res.json(
      ApiResponse.success(
        {
          userId,
          subjectId,
          subjectName: subject.name,
        },
        message
      )
    );
  } catch (err) {
    logHelper.error(req, "【系统错误】用户选择科目失败", err);
    next(err);
  }
};

// GET /user-actions/current-subject
// 接口用途：获取用户当前选择的科目
// 使用场景：应用启动时获取用户上次选择的科目
// 参数说明：
// - userId: 用户ID，默认为"guest"
exports.getCurrentSubject = async (req, res, next) => {
  const { userId = "guest" } = req.query;

  try {
    const db = await connectDB();

    // 获取用户选择的科目记录
    const userAction = await db
      .collection("userActions")
      .findOne(
        { userId, action: "selected_subject" },
        { sort: { updatedAt: -1 } }
      );

    if (!userAction) {
      // 如果没有选择记录，返回默认科目（第一个启用的科目）
      const defaultSubject = await db.collection("subjects").findOne({
        isEnabled: true,
      });
      
      logHelper.info(req, "【业务逻辑信息】用户无科目选择记录，返回默认科目", { userId });
      return res.json(ApiResponse.success(defaultSubject || null));
    }

    // 获取科目详情
    const subject = await db.collection("subjects").findOne({
      _id: userAction.subjectId,
    });

    logHelper.info(req, "【业务逻辑信息】获取用户当前选择的科目成功", { userId, subjectId: userAction.subjectId.toString() });
    res.json(ApiResponse.success(subject || null));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取用户当前选择的科目失败", err);
    next(err);
  }
};

// POST /user-actions/set-audio-preferences
// 接口用途：设置用户的音频播放偏好
// 使用场景：用户在设置中调整音频播放相关的参数
// 参数说明：
// - userId: 用户ID，默认为"guest"
// - audioContents: 播放内容选择数组，可选值为"audio_answer_detail"（精简答案）和"audio_answer_simple"（扩展答案），可以多选
// - playbackSpeed: 播放速度，默认1.0，范围0.5-3.0
// - loopMode: 循环方式，可选值为"list"（列表循环）和"single"（单个题目循环）,none（不循环）
// - loopSettings: 列表循环模式下的设置
//   - audio_answer_simple: 精简答案的循环次数
//   - audio_answer_detail: 扩展答案的循环次数
exports.setAudioPreferences = async (req, res, next) => {
  const {
    userId = "guest",
    audioContents = ["audio_answer_simple"], // 默认播放精简答案
    playbackSpeed = 1.0,
    loopMode = "list",
    loopSettings = {
      audio_answer_simple: 1,
      audio_answer_detail: 1,
    },
  } = req.body;

  // 验证音频内容选择
  const validAudioContents = ["audio_answer_detail", "audio_answer_simple"];
  if (
    !Array.isArray(audioContents) ||
    audioContents.length === 0 ||
    !audioContents.every((content) => validAudioContents.includes(content))
  ) {
    logHelper.error(req, "【参数验证错误】无效的音频内容选择", { userId, audioContents });
    return res.status(400).json(ApiResponse.error("无效的音频内容选择"));
  }

  // 验证播放速度
  const speed = parseFloat(playbackSpeed);
  if (isNaN(speed) || speed < 0.5 || speed > 3.0) {
    logHelper.error(req, "【参数验证错误】播放速度必须在0.5-3.0之间", { userId, playbackSpeed });
    return res.status(400).json(ApiResponse.error("播放速度必须在0.5-3.0之间"));
  }

  // 验证循环模式
  const validLoopModes = ["list", "single"];
  if (!validLoopModes.includes(loopMode)) {
    logHelper.error(req, "【参数验证错误】无效的循环方式", { userId, loopMode });
    return res.status(400).json(ApiResponse.error("无效的循环方式"));
  }

  // 验证循环设置
  if (loopMode === "list") {
    const simpleCount = parseInt(loopSettings.audio_answer_simple) || 1;
    const detailCount = parseInt(loopSettings.audio_answer_detail) || 1;
    if (
      simpleCount < 1 ||
      simpleCount > 10 ||
      detailCount < 1 ||
      detailCount > 10
    ) {
      logHelper.error(req, "【参数验证错误】循环次数必须在1-10之间", { userId, loopSettings });
      return res.status(400).json(ApiResponse.error("循环次数必须在1-10之间"));
    }
  }

  try {
    const db = await connectDB();
    const now = new Date();

    // 更新或插入用户的音频播放偏好
    const result = await db.collection("userActions").updateOne(
      {
        userId,
        action: "audio_preferences",
      },
      {
        $set: {
          audioContents,
          playbackSpeed: speed,
          loopMode,
          loopSettings,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
      }
    );

    const message = 
      result.upsertedCount > 0
        ? "音频播放偏好设置成功"
        : "音频播放偏好更新成功";
        
    logHelper.info(req, "【业务逻辑信息】用户音频播放偏好设置成功", { userId, playbackSpeed: speed, loopMode });
    res.json(
      ApiResponse.success(
        {
          userId,
          audioContents,
          playbackSpeed: speed,
          loopMode,
          loopSettings,
        },
        message
      )
    );
  } catch (err) {
    logHelper.error(req, "【系统错误】用户音频播放偏好设置失败", err);
    next(err);
  }
};

// GET /user-actions/audio-preferences
// 接口用途：获取用户的音频播放偏好
// 使用场景：应用启动时加载用户上次设置的音频播放偏好
// 参数说明：
// - userId: 用户ID，默认为"guest"
exports.getAudioPreferences = async (req, res, next) => {
  const { userId = "guest" } = req.query;

  try {
    const db = await connectDB();

    // 获取用户的音频播放偏好
    const preferences = await db
      .collection("userActions")
      .findOne(
        { userId, action: "audio_preferences" },
        { sort: { updatedAt: -1 } }
      );

    // 如果没有偏好设置，返回默认设置
    if (!preferences) {
      const defaultPreferences = {
        userId,
        audioContents: ["audio_answer_simple"],
        playbackSpeed: 1.0,
        loopMode: "list",
        loopSettings: {
          audio_answer_simple: 1,
          audio_answer_detail: 1,
        },
      };
      
      logHelper.info(req, "【业务逻辑信息】用户无音频播放偏好设置，返回默认设置", { userId });
      return res.json(ApiResponse.success(defaultPreferences));
    }

    // 构建返回结果，排除不需要的字段
    const result = {
      userId: preferences.userId,
      audioContents: preferences.audioContents,
      playbackSpeed: preferences.playbackSpeed,
      loopMode: preferences.loopMode,
      loopSettings: preferences.loopSettings,
    };

    logHelper.info(req, "【业务逻辑信息】获取用户音频播放偏好成功", { userId });
    res.json(ApiResponse.success(result));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取用户音频播放偏好失败", err);
    next(err);
  }
};
