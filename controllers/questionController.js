// controllers/questionController.js
const { ObjectId } = require("mongodb");
const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const logHelper = require("../utils/logWithEndpoint");

// GET /questions/random
// 接口用途：随机获取一道题目
// 使用场景：在练习模式中随机选择题目进行练习
// 参数说明：
// - subjectId: 科目ID，可选，查询参数
// - difficulty: 难度等级，可选，查询参数
exports.getRandomQuestion = async (req, res, next) => {
  const { subjectId, difficulty } = req.query;
  const filter = { isEnabled: true, isDeleted: { $ne: true } };

  if (subjectId) filter.subjectId = new ObjectId(subjectId);
  if (difficulty) filter.difficulty = difficulty;

  try {
    const db = await connectDB();
    const questions = await db
      .collection("questions")
      .aggregate([{ $match: filter }, { $sample: { size: 1 } }])
      .toArray();

    if (questions.length === 0) {
      logHelper.info(req, "【业务逻辑信息】获取随机题目，暂无符合条件的题目", {
        filter,
      });
      return res.json(ApiResponse.success(null, "暂无符合条件的题目"));
    }

    logHelper.info(req, "【业务逻辑信息】获取随机题目成功");
    res.json(ApiResponse.success(questions[0]));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取随机题目失败", err);
    next(err);
  }
};

// POST /questions/list - 获取过滤的题目列表
// 接口用途：根据条件过滤获取题目列表，支持分页和排除用户已删除的题目
// 使用场景：APP端题目列表页面，默认只显示启用的、有音频文件的题目

// POST /mgt/questions/list - 获取过滤的题目列表（管理端）
// 接口用途：根据条件过滤获取题目列表，支持分页和排除用户已删除的题目
// 使用场景：CMS控制台题目列表页面，保留所有过滤参数的灵活性
// 参数说明：
// - subjectId: 科目ID，可选，请求体参数
// - difficulty: 难度等级，可选，支持单个值或数组，请求体参数
// - tags: 标签数组，可选，请求体参数
// - searchKeyword: 搜索关键字，可选，请求体参数，模糊匹配题目相关markdown字段
// - hasAudioFiles: 是否有音频文件，可选，请求体参数，根据files字段是否为空判断
// - isEnabled: 是否启用，可选，请求体参数，根据isEnabled字段过滤题目
// - page: 页码，默认为1，请求体参数
// - limit: 每页数量，默认为20，请求体参数
// - userId: 用户ID，默认为"guest"，用于过滤用户已删除的题目，请求体参数
exports.getManagementQuestionList = async (req, res, next) => {
  const {
    subjectId,
    difficulty,
    tags = [],
    searchKeyword,
    hasAudioFiles,
    isEnabled,
    page = 1,
    limit = 20,
    userId = "guest",
  } = req.body;

  try {
    const db = await connectDB();
    const filter = {};

    // 构建过滤条件
    filter.isDeleted = { $ne: true };

    // 如果传入isEnabled参数，则根据参数值过滤；否则默认显示所有题目（启用和禁用的）
    if (isEnabled !== undefined) {
      // 当isEnabled为null时，不应用此过滤条件，返回所有题目（启用和禁用的）
      if (isEnabled === null) {
        // 不添加isEnabled到过滤条件中
      } else {
        filter.isEnabled = isEnabled;
      }
    }
    // 不传递isEnabled参数时，默认显示所有题目，不添加过滤条件

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
      // 处理新数据格式中标签可能是字符串数组的情况
      filter.tags = { $in: tags };
    }

    // 添加搜索关键字模糊匹配
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim();
      filter.$or = [
        { question_markdown: { $regex: keyword, $options: "i" } },
        { answer_simple_markdown: { $regex: keyword, $options: "i" } },
        { answer_detail_markdown: { $regex: keyword, $options: "i" } },
        { answer_analysis_markdown: { $regex: keyword, $options: "i" } },
      ];
    }

    // 添加音频文件过滤条件
    if (hasAudioFiles !== undefined) {
      if (hasAudioFiles) {
        // 有音频文件：files字段存在且不为空对象
        filter.$and = [
          { files: { $exists: true } },
          { $expr: { $ne: [{ $size: { $objectToArray: "$files" } }, 0] } },
        ];
      } else {
        // 无音频文件：files字段不存在或为空对象
        filter.$or = [
          { files: { $exists: false } },
          { files: {} },
          { $expr: { $eq: [{ $size: { $objectToArray: "$files" } }, 0] } },
        ];
      }
    }

    // 计算分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 使用聚合管道一次性完成过滤和排除已删除题目
    const pipeline = [
      { $match: filter },
      { $lookup: {
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
        searchKeyword,
        hasAudioFiles,
        isEnabled
      },
    };

    logHelper.info(req, "【业务逻辑信息】获取管理端过滤题目列表成功", {
      page: pageNum,
      limit: limitNum,
      total,
    });
    res.json(ApiResponse.success(result));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取管理端过滤题目列表失败", err);
    next(err);
  }
};

// POST /questions/list - 获取过滤的题目列表
// 接口用途：根据条件过滤获取题目列表，支持分页和排除用户已删除的题目
// 使用场景：APP端题目列表页面，默认只显示启用的、有音频文件的题目
// 参数说明：
// - subjectId: 科目ID，可选，请求体参数
// - difficulty: 难度等级，可选，支持单个值或数组，请求体参数
// - tags: 标签数组，可选，请求体参数
// - searchKeyword: 搜索关键字，可选，请求体参数，模糊匹配题目相关markdown字段
// - page: 页码，默认为1，请求体参数
// - limit: 每页数量，默认为20，请求体参数
// - userId: 用户ID，默认为"guest"，用于过滤用户已删除的题目，请求体参数
exports.getFilteredQuestionList = async (req, res, next) => {
  const {
    subjectId,
    difficulty,
    tags = [],
    searchKeyword,
    page = 1,
    limit = 20,
    userId = "guest",
  } = req.body;

  try {
    const db = await connectDB();
    const filter = {};

    // 构建过滤条件
    filter.isDeleted = { $ne: true };
    
    // APP端固定显示启用的题目
    filter.isEnabled = true;
    
    // APP端固定显示有音频文件的题目
    filter.$and = [
      { files: { $exists: true } },
      { $expr: { $ne: [{ $size: { $objectToArray: "$files" } }, 0] } },
    ];
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
      // 处理新数据格式中标签可能是字符串数组的情况
      filter.tags = { $in: tags };
    }

    // 添加搜索关键字模糊匹配
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim();
      filter.$or = [
        { question_markdown: { $regex: keyword, $options: "i" } },
        { answer_simple_markdown: { $regex: keyword, $options: "i" } },
        { answer_detail_markdown: { $regex: keyword, $options: "i" } },
        { answer_analysis_markdown: { $regex: keyword, $options: "i" } },
      ];
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
        searchKeyword,
      },
    };

    logHelper.info(req, "【业务逻辑信息】获取过滤题目列表成功", {
      page: pageNum,
      limit: limitNum,
      total,
    });
    res.json(ApiResponse.success(result));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取过滤题目列表失败", err);
    next(err);
  }
};

// POST /questions/random-list - 随机获取某个科目下的题目列表
// 接口用途：随机获取指定科目下的题目列表，支持难度分布和标签配置
// 使用场景：在智能练习模式中根据配置随机生成题目列表
// 参数说明：
// - subjectId: 科目ID，必填，请求体参数
// - total: 题目总数，默认为10，请求体参数
// - difficultyConfig: 难度分布配置，可选，请求体参数
// - tagConfig: 标签配置，可选，请求体参数
// - isEnabled: 是否启用，可选，请求体参数，根据isEnabled字段过滤题目
exports.getRandomQuestionList = async (req, res, next) => {
  const {
    subjectId,
    total = 10,
    difficultyConfig,
    tagConfig,
    isEnabled,
  } = req.body;

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
      logHelper.error(req, "【参数验证错误】缺少科目ID参数");
      return res.status(400).json(ApiResponse.error("缺少科目 ID 参数"));
    }

    const baseFilter = {
      subjectId: new ObjectId(subjectId),
      isDeleted: { $ne: true },
    };

    // 如果传入isEnabled参数，则根据参数值过滤；否则默认显示所有题目（启用和禁用的）
    if (isEnabled !== undefined) {
      // 当isEnabled为null时，不应用此过滤条件，返回所有题目（启用和禁用的）
      if (isEnabled === null) {
        // 不添加isEnabled到过滤条件中
      } else {
        baseFilter.isEnabled = isEnabled;
      }
    }
    // 不传递isEnabled参数时，默认显示所有题目，不添加过滤条件

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
          tags: { $in: [tag] }, // 处理新数据格式中标签是字符串数组的情况
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

    logHelper.info(req, "【业务逻辑信息】获取随机题目列表成功", {
      subjectId,
      total: allQuestions.length,
    });
    res.json(ApiResponse.success(result));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取随机题目列表失败", err);
    next(err);
  }
};

// POST /questions - 新增题目
// 接口用途：创建新的题目
// 使用场景：在管理后台添加新的题目
// 参数说明：
// - type: 题目类型，必填，请求体参数
// - difficulty: 难度等级，必填，请求体参数
// - tags: 标签数组，可选，请求体参数
// - category: 分类字段，可选，请求体参数
// - question_markdown: 题目内容，必填，请求体参数
// - answer_simple_markdown: 简单答案，必填，请求体参数
// - answer_detail_markdown: 详细答案，可选，请求体参数
// - answer_analysis_markdown: 答案分析，可选，请求体参数
// - files: 文件路径，可选，请求体参数
// - subjectId: 科目ID，必填，请求体参数
exports.createQuestion = async (req, res, next) => {
  try {
    const {
      type,
      difficulty,
      tags = [],
      category,
      question_markdown,
      answer_simple_markdown,
      answer_detail_markdown = "",
      answer_analysis_markdown = "",
      files = {},
      subjectId,
    } = req.body;

    // 验证必填字段
    if (
      !type ||
      !difficulty ||
      !question_markdown ||
      !answer_simple_markdown ||
      !subjectId
    ) {
      logHelper.error(req, "【参数验证错误】缺少必要的题目信息", {
        type,
        difficulty,
        question_markdown,
        answer_simple_markdown,
        subjectId,
      });
      return res.status(400).json(ApiResponse.error("缺少必要的题目信息"));
    }

    // 连接数据库
    const db = await connectDB();

    // 创建题目对象
    const question = {
      _id: new ObjectId(),
      id: `q-${Date.now()}`, // 生成自定义ID
      type,
      difficulty,
      tags,
      category,
      question_markdown,
      answer_simple_markdown,
      answer_detail_markdown,
      answer_analysis_markdown,
      files,
      subjectId: new ObjectId(subjectId),
      question_length: question_markdown.length,
      simple_answer_length: answer_simple_markdown.length,
      detailed_analysis_length: answer_analysis_markdown.length,
      isEnabled: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 插入题目
    const result = await db.collection("questions").insertOne(question);

    if (result.insertedId) {
      logHelper.info(req, "【业务逻辑信息】题目创建成功", {
        questionId: result.insertedId,
      });
      res.status(201).json(ApiResponse.success(question, "题目创建成功"));
    } else {
      logHelper.error(req, "【业务逻辑错误】题目创建失败");
      res.status(500).json(ApiResponse.error("题目创建失败"));
    }
  } catch (err) {
    logHelper.error(req, "【系统错误】创建题目失败", err);
    next(err);
  }
};

// PUT /questions/:id - 编辑题目
// 接口用途：更新题目的信息
// 使用场景：在管理后台编辑已有的题目
// 参数说明：
// - id: 题目ID，路径参数
// - 其他参数与新增题目相同
exports.updateQuestion = async (req, res, next) => {
  const { id } = req.params;

  try {
    const {
      type,
      difficulty,
      tags,
      category,
      question_markdown,
      answer_simple_markdown,
      answer_detail_markdown,
      answer_analysis_markdown,
      files,
      subjectId,
      isEnabled,
    } = req.body;

    // 连接数据库
    const db = await connectDB();

    // 创建更新对象
    const updateData = {};

    if (type !== undefined) updateData.type = type;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (question_markdown !== undefined) {
      updateData.question_markdown = question_markdown;
      updateData.question_length = question_markdown.length;
    }
    if (answer_simple_markdown !== undefined) {
      updateData.answer_simple_markdown = answer_simple_markdown;
      updateData.simple_answer_length = answer_simple_markdown.length;
    }
    if (answer_detail_markdown !== undefined)
      updateData.answer_detail_markdown = answer_detail_markdown;
    if (answer_analysis_markdown !== undefined) {
      updateData.answer_analysis_markdown = answer_analysis_markdown;
      updateData.detailed_analysis_length = answer_analysis_markdown.length;
    }
    if (files !== undefined) updateData.files = files;
    if (subjectId !== undefined) updateData.subjectId = new ObjectId(subjectId);
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

    // 更新时间
    updateData.updatedAt = new Date();

    // 查找并更新题目
    let updatedQuestion;

    // 首先尝试使用ObjectId查询
    let result;
    try {
      const objectId = new ObjectId(id);
      result = await db
        .collection("questions")
        .findOneAndUpdate(
          { _id: objectId },
          { $set: updateData },
          { returnDocument: "after" }
        );
    } catch (objectIdError) {
      // 如果ObjectId查询失败，尝试使用自定义id字段查询
      result = await db
        .collection("questions")
        .findOneAndUpdate(
          { id: id },
          { $set: updateData },
          { returnDocument: "after" }
        );
    }

    if (!result) {
      logHelper.error(req, "【业务逻辑错误】题目不存在", { id });
      return res.status(500).json(ApiResponse.error("题目不存在"));
    }

    logHelper.info(req, "【业务逻辑信息】题目更新成功", { id });
    res.json(ApiResponse.success(result, "题目更新成功"));
  } catch (err) {
    logHelper.error(req, "【系统错误】更新题目失败", err);
    next(err);
  }
};

// DELETE /questions/:id - 软删除题目
// 接口用途：标记题目为已删除，但不物理删除
// 使用场景：在管理后台删除不需要的题目
// 参数说明：
// - id: 题目ID，路径参数，支持ObjectId或自定义ID
exports.deleteQuestion = async (req, res, next) => {
  const { id } = req.params;

  try {
    const db = await connectDB();
    let result;

    // 首先尝试使用ObjectId查询
    try {
      const objectId = new ObjectId(id);
      result = await db
        .collection("questions")
        .findOneAndUpdate(
          { _id: objectId, isDeleted: { $ne: true } },
          { $set: { isDeleted: true, updatedAt: new Date() } },
          { returnDocument: "after" }
        );
    } catch (objectIdError) {
      // 如果ObjectId查询失败，尝试使用自定义id字段查询
      result = await db
        .collection("questions")
        .findOneAndUpdate(
          { id: id, isDeleted: { $ne: true } },
          { $set: { isDeleted: true, updatedAt: new Date() } },
          { returnDocument: "after" }
        );
    }

    if (!result) {
      logHelper.error(req, "【业务逻辑错误】题目不存在或已被删除", { id });
      return res.status(404).json(ApiResponse.error("题目不存在或已被删除"));
    }

    logHelper.info(req, "【业务逻辑信息】题目删除成功", { id });
    res.json(ApiResponse.success(result, "题目删除成功"));
  } catch (err) {
    logHelper.error(req, "【系统错误】删除题目失败", err);
    next(err);
  }
};

// GET /questions/export - 导出题目
// 接口用途：导出符合条件的题目数据为JSON格式
// 使用场景：在管理后台导出题目数据用于备份或迁移
// 参数说明：
// - subjectId: 科目ID，可选，请求体参数
// - difficulty: 难度等级，可选，支持单个值或数组，请求体参数
// - tags: 标签数组，可选，请求体参数
// - searchKeyword: 搜索关键字，可选，请求体参数，模糊匹配题目相关markdown字段
// - hasAudioFiles: 是否有音频文件，可选，请求体参数，根据files字段是否为空判断
// - isEnabled: 是否启用，可选，请求体参数，根据isEnabled字段过滤题目
exports.exportQuestions = async (req, res, next) => {
  const {
    subjectId,
    difficulty,
    tags = [],
    searchKeyword,
    hasAudioFiles,
    isEnabled,
  } = req.body;

  try {
    const db = await connectDB();
    const filter = {};

    // 构建过滤条件
    filter.isDeleted = { $ne: true };

    // 如果传入isEnabled参数，则根据参数值过滤；否则默认显示所有题目（启用和禁用的）
    if (isEnabled !== undefined) {
      // 当isEnabled为null时，不应用此过滤条件，返回所有题目（启用和禁用的）
      if (isEnabled === null) {
        // 不添加isEnabled到过滤条件中
      } else {
        filter.isEnabled = isEnabled;
      }
    }
    // 不传递isEnabled参数时，默认显示所有题目，不添加过滤条件

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
      // 处理新数据格式中标签可能是字符串数组的情况
      filter.tags = { $in: tags };
    }

    // 添加搜索关键字模糊匹配
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim();
      filter.$or = [
        { question_markdown: { $regex: keyword, $options: "i" } },
        { answer_simple_markdown: { $regex: keyword, $options: "i" } },
        { answer_detail_markdown: { $regex: keyword, $options: "i" } },
        { answer_analysis_markdown: { $regex: keyword, $options: "i" } },
      ];
    }

    // 添加音频文件过滤条件
    if (hasAudioFiles !== undefined) {
      if (hasAudioFiles) {
        // 有音频文件：files字段存在且不为空对象
        filter.$and = [
          { files: { $exists: true } },
          { $expr: { $ne: [{ $size: { $objectToArray: "$files" } }, 0] } },
        ];
      } else {
        // 无音频文件：files字段不存在或为空对象
        filter.$or = [
          { files: { $exists: false } },
          { files: {} },
          { $expr: { $eq: [{ $size: { $objectToArray: "$files" } }, 0] } },
        ];
      }
    }

    // 获取所有符合条件的题目数据
    const questions = await db
      .collection("questions")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    logHelper.info(req, "【业务逻辑信息】导出题目数据成功", {
      count: questions.length,
    });

    // 设置响应头，提示浏览器下载文件
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="questions-export.json"'
    );

    // 返回题目数据
    res.json(questions);
  } catch (err) {
    logHelper.error(req, "【系统错误】导出题目数据失败", err);
    next(err);
  }
};

// GET /questions/:id - 根据ID获取题目详情
// 接口用途：根据题目ID获取题目详细信息
// 使用场景：在题目详情页面展示题目的完整内容
// 参数说明：
// - id: 题目ID，路径参数，支持ObjectId或自定义ID
exports.getQuestionById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const db = await connectDB();
    let question;

    // 首先尝试使用ObjectId查询
    try {
      const objectId = new ObjectId(id);
      question = await db
        .collection("questions")
        .findOne({ _id: objectId, isDeleted: { $ne: true } });
    } catch (objectIdError) {
      // 如果ObjectId查询失败，尝试使用自定义id字段查询
      question = await db
        .collection("questions")
        .findOne({ id: id, isDeleted: { $ne: true } });
    }

    if (!question) {
      logHelper.error(req, "【业务逻辑错误】题目不存在", { id });
      return res.status(500).json(ApiResponse.error("题目不存在"));
    }

    logHelper.info(req, "【业务逻辑信息】获取题目详情成功", { id });
    res.json(ApiResponse.success(question));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取题目详情失败", err);
    next(err);
  }
};
