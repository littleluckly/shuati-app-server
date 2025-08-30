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

// GET /subjects/all - 获取所有科目详细信息
exports.getAllSubjects = async (req, res, next) => {
  try {
    const db = await connectDB();
    const subjects = await db
      .collection("subjects")
      .find({ isEnabled: true })
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

    res.json(ApiResponse.success(subjectsWithStats));
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

// GET /subjects/:id/tags - 根据科目 ID 获取所有标签
exports.getTagsBySubjectId = async (req, res, next) => {
  const { id } = req.params;
  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new require("mongodb").ObjectId(id) });

    if (!subject) {
      return res.status(404).json(ApiResponse.error("科目不存在"));
    }

    // 获取该科目下所有题目的标签统计
    const tagStats = await db
      .collection("questions")
      .aggregate([
        { $match: { subjectId: new require("mongodb").ObjectId(id) } },
        { $unwind: { path: "$tags", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: "$tags",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const tags = tagStats.map((tag) => ({
      name: tag._id,
      count: tag.count,
    }));

    res.json(ApiResponse.success(tags));
  } catch (err) {
    next(err);
  }
};

// POST /subjects/:id/user-tags - 添加用户自定义标签
exports.addUserTag = async (req, res, next) => {
  const { id } = req.params;
  const { name, type } = req.body;

  if (!name) {
    return res.status(400).json(ApiResponse.error("标签名称不能为空"));
  }

  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db
      .collection("subjects")
      .findOne({ _id: new require("mongodb").ObjectId(id) });

    if (!subject) {
      return res.status(404).json(ApiResponse.error("科目不存在"));
    }

    // 添加用户标签到 userTags 数组（如果不存在）
    const result = await db.collection("subjects").updateOne(
      { _id: new require("mongodb").ObjectId(id) },
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
      return res.status(404).json(ApiResponse.error("科目不存在"));
    }

    res.json(ApiResponse.success(null, "标签添加成功"));
  } catch (err) {
    next(err);
  }
};

// PUT /subjects/:id/user-tags/:tagName - 修改用户自定义标签
exports.updateUserTag = async (req, res, next) => {
  const { id, tagName } = req.params;
  const { newName, type } = req.body;

  if (!newName) {
    return res.status(400).json(ApiResponse.error("新标签名称不能为空"));
  }

  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db.collection("subjects").findOne({
      _id: new require("mongodb").ObjectId(id),
    });

    if (!subject) {
      return res.status(404).json(ApiResponse.error("科目不存在"));
    }

    // 检查要修改的标签是否存在于 userTags 中（不是内置标签）
    const isUserTag =
      subject.userTags && subject.userTags.some((tag) => tag.name === tagName);

    if (!isUserTag) {
      return res.status(400).json(ApiResponse.error("只能修改用户自定义标签"));
    }

    // 更新 userTags 数组中的标签
    const result = await db.collection("subjects").updateOne(
      {
        _id: new require("mongodb").ObjectId(id),
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
      return res.status(404).json(ApiResponse.error("标签不存在"));
    }

    // 同时更新该科目下所有题目中的对应标签
    await db.collection("questions").updateMany(
      {
        subjectId: new require("mongodb").ObjectId(id),
        tags: tagName,
      },
      {
        $set: {
          "tags.$": newName,
        },
      }
    );

    res.json(ApiResponse.success(null, "标签修改成功"));
  } catch (err) {
    next(err);
  }
};

// DELETE /subjects/:id/user-tags/:tagName - 删除用户自定义标签
exports.deleteUserTag = async (req, res, next) => {
  const { id, tagName } = req.params;

  try {
    const db = await connectDB();

    // 验证科目是否存在
    const subject = await db.collection("subjects").findOne({
      _id: new require("mongodb").ObjectId(id),
    });

    if (!subject) {
      return res.status(404).json(ApiResponse.error("科目不存在"));
    }

    // 检查要删除的标签是否存在于 userTags 中（不是内置标签）
    const isUserTag =
      subject.userTags && subject.userTags.some((tag) => tag.name === tagName);

    if (!isUserTag) {
      return res.status(400).json(ApiResponse.error("只能删除用户自定义标签"));
    }

    // 从 userTags 数组中移除标签
    const result = await db.collection("subjects").updateOne(
      { _id: new require("mongodb").ObjectId(id) },
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
      return res.status(404).json(ApiResponse.error("科目不存在"));
    }

    // 同时从该科目下所有题目中移除对应标签
    await db.collection("questions").updateMany(
      {
        subjectId: new require("mongodb").ObjectId(id),
        tags: tagName,
      },
      {
        $pull: {
          tags: tagName,
        },
      }
    );

    res.json(ApiResponse.success(null, "标签删除成功"));
  } catch (err) {
    next(err);
  }
};
