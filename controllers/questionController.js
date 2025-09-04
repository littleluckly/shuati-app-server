// controllers/questionController.js
const { ObjectId } = require("mongodb");
const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");

// GET /questions/random
exports.getRandomQuestion = async (req, res, next) => {
  const { subjectId, difficulty } = req.query;
  const filter = { isEnabled: true };

  if (subjectId) filter.subjectId = new ObjectId(subjectId);
  if (difficulty) filter.difficulty = difficulty;

  try {
    const db = await connectDB();
    const questions = await db
      .collection("questions")
      .aggregate([{ $match: filter }, { $sample: { size: 1 } }])
      .toArray();

    if (questions.length === 0) {
      return res.json(ApiResponse.success(null, "暂无符合条件的题目"));
    }

    res.json(ApiResponse.success(questions[0]));
  } catch (err) {
    next(err);
  }
};

// POST /questions/list - 获取过滤的题目列表
exports.getFilteredQuestionList = async (req, res, next) => {
  const {
    subjectId,
    difficulty,
    tags = [],
    page = 1,
    limit = 20,
    userId = "guest",
  } = req.body;

  try {
    const db = await connectDB();
    const filter = {};

    // 构建过滤条件
    if (subjectId) {
      filter.subjectId = new ObjectId(subjectId);
    }

    if (difficulty) {
      if (Array.isArray(difficulty)) {
        // 如果是数组，使用 $in 操作符
        filter.difficulty = { $in: difficulty };
      } else {
        // 如果是单个值，直接匹配
        filter.difficulty = difficulty;
      }
    }

    // 支持多个标签过滤
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // 计算分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 使用聚合管道一次性完成过滤和排除已删除题目
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "userActions",
          let: { questionId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", userId] },
                    { $eq: ["$action", "deleted"] },
                    { $eq: ["$questionId", "$$questionId"] },
                  ],
                },
              },
            },
          ],
          as: "deletedActions",
        },
      },
      { $match: { deletedActions: { $size: 0 } } }, // 只保留没有被用户删除的题目
      { $project: { deletedActions: 0 } }, // 移除临时字段
    ];

    // 获取总数
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await db
      .collection("questions")
      .aggregate(countPipeline)
      .toArray();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // 获取分页数据
    const dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1, _id: 1 } }, // 按创建时间倒序，然后按_id正序确保稳定排序
      { $skip: skip },
      { $limit: limitNum },
    ];

    const questions = await db
      .collection("questions")
      .aggregate(dataPipeline)
      .toArray();

    const result = {
      questions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
      filters: {
        subjectId,
        difficulty,
        tags,
      },
    };

    res.json(ApiResponse.success(result));
  } catch (err) {
    next(err);
  }
};

// POST /questions/random-list - 随机获取某个科目下的题目列表
exports.getRandomQuestionList = async (req, res, next) => {
  const { subjectId, total = 10, difficultyConfig, tagConfig } = req.body;

  // 默认难度分布配置
  const defaultDifficultyConfig = {
    easy: 0.4, // 40% 简单
    medium: 0.4, // 40% 中等
    hard: 0.2, // 20% 困难
  };

  try {
    // 使用请求体中的难度分布配置或默认配置
    const finalDifficultyConfig = difficultyConfig || defaultDifficultyConfig;

    const db = await connectDB();
    const totalNum = parseInt(total);
    let allQuestions = [];

    if (!subjectId) {
      return res.status(400).json(ApiResponse.error("缺少科目 ID 参数"));
    }

    const baseFilter = {
      subjectId: new ObjectId(subjectId),
    };

    // 按难度分布获取题目
    for (const [difficulty, ratio] of Object.entries(finalDifficultyConfig)) {
      const count = Math.round(totalNum * ratio);
      if (count > 0) {
        const filter = { ...baseFilter, difficulty };

        const questions = await db
          .collection("questions")
          .aggregate([{ $match: filter }, { $sample: { size: count } }])
          .toArray();

        allQuestions = allQuestions.concat(questions);
      }
    }

    // 如果有标签配置，进一步筛选
    if (tagConfig && Object.keys(tagConfig).length > 0) {
      let tagQuestions = [];

      for (const [tag, count] of Object.entries(tagConfig)) {
        const filter = {
          ...baseFilter,
          tags: { $in: [tag] },
        };

        const questions = await db
          .collection("questions")
          .aggregate([
            { $match: filter },
            { $sample: { size: parseInt(count) } },
          ])
          .toArray();

        tagQuestions = tagQuestions.concat(questions);
      }

      // 合并结果，去重
      const questionIds = new Set();
      const combinedQuestions = [];

      [...allQuestions, ...tagQuestions].forEach((question) => {
        if (!questionIds.has(question._id.toString())) {
          questionIds.add(question._id.toString());
          combinedQuestions.push(question);
        }
      });

      allQuestions = combinedQuestions;
    }

    // 如果题目数不够，随机补充
    if (allQuestions.length < totalNum) {
      const existingIds = allQuestions.map((q) => q._id);
      const additionalCount = totalNum - allQuestions.length;

      const additionalQuestions = await db
        .collection("questions")
        .aggregate([
          {
            $match: {
              ...baseFilter,
              _id: { $nin: existingIds },
            },
          },
          { $sample: { size: additionalCount } },
        ])
        .toArray();

      allQuestions = allQuestions.concat(additionalQuestions);
    }

    // 随机打乱顺序
    allQuestions = allQuestions.sort(() => Math.random() - 0.5);

    // 截取指定数量
    allQuestions = allQuestions.slice(0, totalNum);

    const result = {
      questions: allQuestions,
      total: allQuestions.length,
      config: {
        requestedTotal: totalNum,
        difficultyConfig: finalDifficultyConfig,
        tagConfig,
      },
    };

    res.json(ApiResponse.success(result));
  } catch (err) {
    next(err);
  }
};

// GET /questions/:id - 根据ID获取题目详情
exports.getQuestionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const db = await connectDB();
    let question;

    // 首先尝试使用ObjectId查询
    try {
      const objectId = new ObjectId(id);
      question = await db.collection("questions").findOne({ _id: objectId });
    } catch (objectIdError) {
      // 如果ObjectId查询失败，尝试使用自定义id字段查询
      question = await db.collection("questions").findOne({ id: id });
    }

    if (!question) {
      return res.status(404).json(ApiResponse.error("题目不存在"));
    }

    res.json(ApiResponse.success(question));
  } catch (err) {
    next(err);
  }
};
