// controllers/subjectController.js
const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const { ObjectId } = require("mongodb");
const logHelper = require("../utils/logWithEndpoint");

// POST /subjects
// 接口用途：新增科目
// 使用场景：在后台管理系统添加新的科目
// 参数说明：
// - name: 科目名称，请求体参数
// - code: 科目代码，请求体参数
// - description: 科目描述，请求体参数
// - tags: 科目标签列表，请求体参数
// - difficultyLevels: 难度等级列表，请求体参数
exports.createSubject = async (req, res, next) => {
  try {
    const {
      name,
      code,
      description,
      tags = [],
      difficultyLevels = [],
    } = req.body;

    if (!name) {
      logHelper.error(req, "【参数验证错误】科目名称不能为空");
      return res.status(400).json(ApiResponse.error("科目名称不能为空"));
    }

    const db = await connectDB();

    // 检查科目名称是否已存在
    const existingSubject = await db
      .collection("subjects")
      .findOne({ name, isDeleted: { $ne: true } });

    if (existingSubject) {
      logHelper.error(req, "【业务逻辑错误】科目名称已存在", { name });
      return res.status(400).json(ApiResponse.error("科目名称已存在"));
    }

    // 检查科目代码是否已存在（如果提供了code）
    if (code) {
      const existingCode = await db
        .collection("subjects")
        .findOne({ code, isDeleted: { $ne: true } });

      if (existingCode) {
        logHelper.error(req, "【业务逻辑错误】科目代码已存在", { code });
        return res.status(400).json(ApiResponse.error("科目代码已存在"));
      }
    }

    const newSubject = {
      name,
      code: code || "",
      description: description || "",
      tags,
      difficultyLevels,
      isEnabled: true,
      isDeleted: false,
      userTags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("subjects").insertOne(newSubject);

    logHelper.info(req, "【业务逻辑信息】科目创建成功", {
      subjectId: result.insertedId,
      name,
    });
    res
      .status(201)
      .json(
        ApiResponse.success(
          { _id: result.insertedId, ...newSubject },
          "科目创建成功"
        )
      );
  } catch (err) {
    logHelper.error(req, "【系统错误】科目创建失败", err);
    next(err);
  }
};

// PUT /subjects/:id
// 接口用途：修改科目信息
// 使用场景：在后台管理系统更新科目的基本信息
// 参数说明：
// - id: 科目ID，路径参数
// - name: 科目名称，请求体参数
// - code: 科目代码，请求体参数
// - description: 科目描述，请求体参数
// - tags: 科目标签列表，请求体参数
// - difficultyLevels: 难度等级列表，请求体参数
// - isEnabled: 是否启用，请求体参数
exports.updateSubject = async (req, res, next) => {
  const { id } = req.params;
  const { name, code, description, tags, difficultyLevels, isEnabled } =
    req.body;

  try {
    const db = await connectDB();
    const objectId = new ObjectId(id);

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: objectId, isDeleted: { $ne: true } });

    if (!subject) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (difficultyLevels !== undefined)
      updateData.difficultyLevels = difficultyLevels;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    updateData.updatedAt = new Date();

    // 如果更新了名称，检查新名称是否已存在
    if (name && name !== subject.name) {
      const existingSubject = await db
        .collection("subjects")
        .findOne({ name, isDeleted: { $ne: true }, _id: { $ne: objectId } });

      if (existingSubject) {
        logHelper.error(req, "【业务逻辑错误】科目名称已存在", { name });
        return res.status(400).json(ApiResponse.error("科目名称已存在"));
      }
    }

    // 如果更新了代码，检查新代码是否已存在
    if (code && code !== subject.code) {
      const existingCode = await db
        .collection("subjects")
        .findOne({ code, isDeleted: { $ne: true }, _id: { $ne: objectId } });

      if (existingCode) {
        logHelper.error(req, "【业务逻辑错误】科目代码已存在", { code });
        return res.status(400).json(ApiResponse.error("科目代码已存在"));
      }
    }

    const result = await db
      .collection("subjects")
      .updateOne({ _id: objectId }, { $set: updateData });

    if (result.matchedCount === 0) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 获取更新后的科目信息
    const updatedSubject = await db
      .collection("subjects")
      .findOne({ _id: objectId });

    logHelper.info(req, "【业务逻辑信息】科目更新成功", {
      subjectId: id,
      name: updatedSubject.name,
    });
    res.json(ApiResponse.success(updatedSubject, "科目更新成功"));
  } catch (err) {
    logHelper.error(req, "【系统错误】科目更新失败", err);
    next(err);
  }
};

// DELETE /subjects/:id
// 接口用途：删除科目（软删除）
// 使用场景：在后台管理系统删除科目
// 参数说明：
// - id: 科目ID，路径参数
exports.deleteSubject = async (req, res, next) => {
  const { id } = req.params;

  try {
    const db = await connectDB();
    const objectId = new ObjectId(id);

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: objectId, isDeleted: { $ne: true } });

    if (!subject) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 执行软删除，将isDeleted标记为true
    const result = await db.collection("subjects").updateOne(
      { _id: objectId },
      {
        $set: {
          isDeleted: true,
          isEnabled: false,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    logHelper.info(req, "【业务逻辑信息】科目删除成功", {
      subjectId: id,
      name: subject.name,
    });
    res.json(ApiResponse.success(null, "科目删除成功"));
  } catch (err) {
    logHelper.error(req, "【系统错误】科目删除失败", err);
    next(err);
  }
};

// GET /subjects
// 接口用途：获取所有启用状态的科目列表
// 使用场景：在应用首页或科目选择页面展示所有可用科目
exports.getSubjects = async (req, res, next) => {
  try {
    const db = await connectDB();

    // 获取分页参数和搜索参数，设置默认值
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // 限制最大每页50条
    const skip = (page - 1) * limit;
    const searchKeyword = req.query.searchKeyword || "";

    // 构建查询条件
    const query = {
      isEnabled: true,
      isDeleted: { $ne: true },
    };

    // 如果有搜索关键词，添加模糊搜索条件
    if (searchKeyword) {
      query.$or = [
        { name: { $regex: searchKeyword, $options: "i" } }, // 不区分大小写匹配科目名称
        { code: { $regex: searchKeyword, $options: "i" } }, // 不区分大小写匹配科目code
      ];
    }

    // 查询当前页的数据
    const subjectsData = await db
      .collection("subjects")
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    // 获取总记录数
    const total = await db.collection("subjects").countDocuments(query);

    // 计算总页数
    const totalPages = Math.ceil(total / limit);

    // 构建响应数据，保持与题目列表接口格式一致
    const responseData = {
      subjects: subjectsData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        isEnabled: true,
        searchKeyword: searchKeyword || undefined, // 只有有值时才返回
      },
    };

    logHelper.info(req, "【业务逻辑信息】获取科目列表成功", {
      page,
      limit,
      total,
      searchKeyword,
    });
    res.json(ApiResponse.success(responseData));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取科目列表失败", err);
    next(err);
  }
};

// GET /subjects/all - 获取所有科目详细信息
// 接口用途：获取所有启用状态的科目列表，包含题目统计信息
// 使用场景：在科目管理页面展示科目及其题目统计信息
exports.getAllSubjects = async (req, res, next) => {
  try {
    const db = await connectDB();

    // 获取分页参数和搜索参数，设置默认值
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // 限制最大每页50条
    const skip = (page - 1) * limit;
    const searchKeyword = req.query.searchKeyword || "";

    // 构建查询条件
    const query = {
      isEnabled: true,
      isDeleted: { $ne: true },
    };

    // 如果有搜索关键词，添加模糊搜索条件
    if (searchKeyword) {
      query.$or = [
        { name: { $regex: searchKeyword, $options: "i" } }, // 不区分大小写匹配科目名称
        { code: { $regex: searchKeyword, $options: "i" } }, // 不区分大小写匹配科目code
      ];
    }

    // 获取总记录数
    const total = await db.collection("subjects").countDocuments(query);

    // 计算总页数
    const totalPages = Math.ceil(total / limit);

    // 查询当前页的数据
    const subjects = await db
      .collection("subjects")
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    // 为每个科目获取题目统计信息
    const subjectsWithStats = await Promise.all(
      subjects.map(async (subject) => {
        const questionStats = await db
          .collection("questions")
          .aggregate([
            { $match: { subjectId: subject._id } },
            {
              $group: {
                _id: "$difficulty",
                count: { $sum: 1 },
              },
            },
          ])
          .toArray();

        const totalQuestions = await db
          .collection("questions")
          .countDocuments({ subjectId: subject._id });

        return {
          ...subject,
          questionStats: {
            total: totalQuestions,
            byDifficulty: questionStats.reduce((acc, stat) => {
              acc[stat._id || "未知"] = stat.count;
              return acc;
            }, {}),
          },
        };
      })
    );

    // 构建响应数据，保持与题目列表接口格式一致
    const responseData = {
      subjects: subjectsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        isEnabled: true,
        searchKeyword: searchKeyword || undefined, // 只有有值时才返回
      },
    };

    logHelper.info(req, "【业务逻辑信息】获取科目详细列表成功", {
      page,
      limit,
      total,
      searchKeyword,
    });
    res.json(ApiResponse.success(responseData));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取科目详细列表失败", err);
    next(err);
  }
};

// GET /subjects/:id
// 接口用途：根据ID获取科目详情
// 使用场景：在科目详情页面展示特定科目的详细信息
// 参数说明：
// - id: 科目ID，路径参数
exports.getSubjectById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const db = await connectDB();
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new ObjectId(id) });
    if (!subject) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }
    logHelper.info(req, "【业务逻辑信息】获取科目详情成功", {
      subjectId: id,
      name: subject.name,
    });
    res.json(ApiResponse.success(subject));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取科目详情失败", err);
    next(err);
  }
};

// GET /subjects/:id/tags-count - 根据科目 ID 获取所有标签计数
// 接口用途：获取指定科目下所有题目的标签及其数量统计
// 使用场景：在科目页面展示标签云或标签统计信息
// 参数说明：
// - id: 科目ID，路径参数
exports.getTagCountBySubjectId = async (req, res, next) => {
  const { id } = req.params;
  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new ObjectId(id) });

    if (!subject) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 获取该科目下所有题目的标签统计
    // 处理新数据格式中标签可能是字符串数组的情况
    const tagStats = await db
      .collection("questions")
      .aggregate([
        { $match: { subjectId: new ObjectId(id) } },
        { $unwind: { path: "$tags", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: {
              $cond: {
                if: { $isArray: "$tags" },
                then: "$tags",
                else: ["$tags"],
              },
            },
            count: { $sum: 1 },
          },
        },
        { $unwind: "$_id" },
        {
          $group: {
            _id: "$_id",
            count: { $sum: "$count" },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const tags = tagStats.map((tag) => ({
      name: tag._id,
      count: tag.count,
    }));

    logHelper.info(req, "【业务逻辑信息】获取科目标签统计成功", {
      subjectId: id,
      tagCount: tags.length,
    });
    res.json(ApiResponse.success(tags));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取科目标签统计失败", err);
    next(err);
  }
};

// POST /subjects/:id/user-tags - 添加用户自定义标签
// 接口用途：为指定科目添加用户自定义标签
// 使用场景：当用户想要为科目添加自定义标签时使用
// 参数说明：
// - id: 科目ID，路径参数
// - name: 标签名称，请求体参数
// - type: 标签类型，请求体参数，默认为"custom"
exports.addUserTag = async (req, res, next) => {
  const { id } = req.params;
  const { name, type } = req.body;

  if (!name) {
    logHelper.error(req, "【参数验证错误】标签名称不能为空");
    return res.status(400).json(ApiResponse.error("标签名称不能为空"));
  }

  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new ObjectId(id) });

    if (!subject) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 添加用户标签到 userTags 数组（如果不存在）
    const result = await db.collection("subjects").updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: {
          userTags: { name, type: type || "custom" },
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    logHelper.info(req, "【业务逻辑信息】标签添加成功", {
      subjectId: id,
      tagName: name,
    });
    res.json(ApiResponse.success(null, "标签添加成功"));
  } catch (err) {
    logHelper.error(req, "【系统错误】标签添加失败", err);
    next(err);
  }
};

// GET /subjects/:id/all-tags - 根据科目 ID 获取所有标签（不带统计）
// 接口用途：获取指定科目的所有标签，不包含数量统计
// 使用场景：在题目筛选页面展示科目可用的标签列表
// 参数说明：
// - id: 科目ID，路径参数
exports.getAllTagsBySubjectId = async (req, res, next) => {
  const { id } = req.params;
  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new ObjectId(id) });

    if (!subject) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 返回该科目的所有标签（包含name和type字段）
    const tags = subject.tags || [];

    logHelper.info(req, "【业务逻辑信息】获取科目标签列表成功", {
      subjectId: id,
      tagCount: tags.length,
    });
    res.json(ApiResponse.success(tags));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取科目标签列表失败", err);
    next(err);
  }
};

// PUT /subjects/:id/user-tags/:tagName - 修改用户自定义标签
// 接口用途：修改指定科目的用户自定义标签
// 使用场景：当用户想要修改之前添加的自定义标签时使用
// 参数说明：
// - id: 科目ID，路径参数
// - tagName: 原标签名称，路径参数
// - newName: 新标签名称，请求体参数
// - type: 新标签类型，请求体参数
exports.updateUserTag = async (req, res, next) => {
  const { id, tagName } = req.params;
  const { newName, type } = req.body;

  if (!newName) {
    logHelper.error(req, "【参数验证错误】新标签名称不能为空");
    return res.status(400).json(ApiResponse.error("新标签名称不能为空"));
  }

  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db.collection("subjects").findOne({
      _id: new ObjectId(id),
    });

    if (!subject) {
      logHelper.error(req, "【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 检查要修改的标签是否存在于 userTags 中（不是内置标签）
    const isUserTag =
      subject.userTags && subject.userTags.some((tag) => tag.name === tagName);

    if (!isUserTag) {
      logHelper.error(req, "【业务逻辑错误】只能修改用户自定义标签", {
        tagName,
      });
      return res.status(400).json(ApiResponse.error("只能修改用户自定义标签"));
    }

    // 更新 userTags 数组中的标签
    const result = await db.collection("subjects").updateOne(
      {
        _id: new ObjectId(id),
        "userTags.name": tagName,
      },
      {
        $set: {
          "userTags.$.name": newName,
          "userTags.$.type": type || "custom",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      logHelper.error(req, "【业务逻辑错误】标签不存在", { tagName });
      return res.status(500).json(ApiResponse.error("标签不存在"));
    }

    // 同时更新该科目下所有题目中的对应标签
    await db.collection("questions").updateMany(
      {
        subjectId: new ObjectId(id),
        tags: tagName,
      },
      {
        $set: {
          "tags.$": newName,
        },
      }
    );

    logHelper.info(req, "【业务逻辑信息】标签修改成功", {
      subjectId: id,
      oldTagName: tagName,
      newTagName: newName,
    });
    res.json(ApiResponse.success(null, "标签修改成功"));
  } catch (err) {
    logHelper.error(req, "【系统错误】标签修改失败", err);
    next(err);
  }
};

// DELETE /subjects/:id/user-tags/:tagName - 删除用户自定义标签
// 接口用途：删除指定科目的用户自定义标签
// 使用场景：当用户想要删除之前添加的自定义标签时使用
// 参数说明：
// - id: 科目ID，路径参数
// - tagName: 要删除的标签名称，路径参数
exports.deleteUserTag = async (req, res, next) => {
  const { id, tagName } = req.params;

  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db.collection("subjects").findOne({
      _id: new ObjectId(id),
    });

    if (!subject) {
      console.log("【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 检查要删除的标签是否存在于 userTags 中（不是内置标签）
    const isUserTag =
      subject.userTags && subject.userTags.some((tag) => tag.name === tagName);

    if (!isUserTag) {
      logHelper.error(req, "【业务逻辑错误】只能删除用户自定义标签", {
        tagName,
      });
      return res.status(400).json(ApiResponse.error("只能删除用户自定义标签"));
    }

    // 从 userTags 数组中移除标签
    const result = await db.collection("subjects").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          userTags: { name: tagName },
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      console.log("【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 同时从该科目下所有题目中移除对应标签
    await db.collection("questions").updateMany(
      {
        subjectId: new ObjectId(id),
        tags: tagName,
      },
      {
        $pull: {
          tags: tagName,
        },
      }
    );

    logHelper.info(req, "【业务逻辑信息】标签删除成功", {
      subjectId: id,
      tagName,
    });
    res.json(ApiResponse.success(null, "标签删除成功"));
  } catch (err) {
    logHelper.error(req, "【系统错误】标签删除失败", err);
    next(err);
  }
};

// GET /subjects/:id/difficulty-levels - 根据科目 ID 获取困难程度
// 接口用途：获取指定科目下所有题目的难度统计
// 使用场景：在科目页面展示难度分布统计信息
// 参数说明：
// - id: 科目ID，路径参数
exports.getDifficultyLevelsBySubjectId = async (req, res, next) => {
  const { id } = req.params;
  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new ObjectId(id) });

    if (!subject) {
      console.log("【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }

    // 获取该科目下所有题目的难度统计
    const difficultyStats = await db
      .collection("questions")
      .aggregate([
        { $match: { subjectId: new ObjectId(id) } },
        {
          $group: {
            _id: "$difficulty",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const difficultyLevels = difficultyStats.map((level) => ({
      level: level._id,
      value: level.count,
    }));

    logHelper.info(req, "【业务逻辑信息】获取科目难度统计成功", {
      subjectId: id,
      levelCount: difficultyLevels.length,
    });
    res.json(ApiResponse.success(difficultyLevels));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取科目难度统计失败", err);
    next(err);
  }
};

// GET /subjects/:id/difficulty-options - 根据科目 ID 获取困难程度选项
// 接口用途：获取指定科目的难度选项列表
// 使用场景：在题目筛选页面展示可用的难度选项
// 参数说明：
// - id: 科目ID，路径参数
exports.getDifficultyOptionsBySubjectId = async (req, res, next) => {
  const { id } = req.params;
  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new ObjectId(id) });

    if (!subject) {
      console.log("【业务逻辑错误】科目不存在", { id });
      return res.status(500).json(ApiResponse.error("科目不存在"));
    }
    logHelper.info(req, "【业务逻辑信息】获取科目难度选项成功", {
      subjectId: id,
      optionCount: subject.difficultyLevels
        ? subject.difficultyLevels.length
        : 0,
    });
    res.json(ApiResponse.success(subject.difficultyLevels));
  } catch (err) {
    logHelper.error(req, "【系统错误】获取科目难度选项失败", err);
    next(err);
  }
};
