// controllers/userActionController.js
const { connectDB } = require("../config/db");
const ApiResponse = require("../utils/ApiResponse");
const { ObjectId } = require("mongodb");

// POST /user-actions/register
// 接口用途：用户注册
// 使用场景：新用户创建账号时调用此接口
// 参数说明：
// - username: 用户名，必填
// - password: 密码，必填
// - email: 邮箱，必填
exports.register = async (req, res, next) => {
  const { username, password, email } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json(ApiResponse.error("缺少必要参数: username、password 和 email"));
  }
  
  try {
    const db = await connectDB();
    const now = new Date();
    
    // 检查用户名是否已存在
    const existingUserByUsername = await db.collection("users").findOne({
      username
    });
    
    if (existingUserByUsername) {
      return res.status(400).json(ApiResponse.error("用户名已存在"));
    }
    
    // 检查邮箱是否已存在
    const existingUserByEmail = await db.collection("users").findOne({
      email
    });
    
    if (existingUserByEmail) {
      return res.status(400).json(ApiResponse.error("邮箱已被注册"));
    }
    
    // 创建新用户（注意：实际生产环境应使用密码加密，如bcrypt）
    const newUser = {
      username,
      password, // 注意：实际环境应使用加密密码
      email,
      role: "user",
      isEnabled: true,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await db.collection("users").insertOne(newUser);
    
    // 记录注册行为
    await db.collection("userActions").insertOne({
      userId: result.insertedId.toString(),
      action: "register",
      username,
      email,
      createdAt: now
    });
    
    res.json(ApiResponse.success({
      userId: result.insertedId.toString(),
      username,
      email
    }, "注册成功"));
  } catch (err) {
    next(err);
  }
};

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

// POST /user-actions/forgot-password
// 接口用途：忘记密码，发送重置密码链接到用户邮箱
// 使用场景：用户忘记密码时调用此接口
// 参数说明：
// - email: 用户邮箱，必填
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json(ApiResponse.error("缺少必要参数: email"));
  }
  
  try {
    const db = await connectDB();
    
    // 查找邮箱对应的用户
    const user = await db.collection("users").findOne({
      email,
      isEnabled: true
    });
    
    if (!user) {
      // 为了安全起见，即使邮箱不存在也返回成功消息，不泄露用户信息
      return res.json(ApiResponse.success(null, "如果该邮箱存在，我们已发送重置密码链接"));
    }
    
    // 生成重置密码令牌，有效期15分钟
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000); // 15分钟后过期
    const resetToken = `reset_${user._id}_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 保存重置密码令牌到用户行为集合
    await db.collection("userActions").insertOne({
      userId: user._id.toString(),
      action: "reset_password_request",
      email,
      resetToken,
      expiresAt,
      createdAt: now
    });
    
    // 在实际应用中，这里应该发送邮件到用户邮箱，包含重置密码链接
    // 链接中应包含resetToken和userId参数
    console.log(`生成密码重置令牌 ${resetToken} 给用户 ${user.username}(${user.email})`);
    
    res.json(ApiResponse.success(null, "如果该邮箱存在，我们已发送重置密码链接"));
  } catch (err) {
    next(err);
  }
};

// POST /user-actions/reset-password
// 接口用途：重置密码
// 使用场景：用户通过重置密码链接进入后调用此接口
// 参数说明：
// - userId: 用户ID，必填
// - resetToken: 重置密码令牌，必填
// - newPassword: 新密码，必填
exports.resetPassword = async (req, res, next) => {
  const { userId, resetToken, newPassword } = req.body;
  
  if (!userId || !resetToken || !newPassword) {
    return res.status(400).json(ApiResponse.error("缺少必要参数: userId、resetToken 和 newPassword"));
  }
  
  try {
    const db = await connectDB();
    const now = new Date();
    
    // 验证重置密码请求是否有效
    const resetRequest = await db.collection("userActions").findOne({
      userId,
      action: "reset_password_request",
      resetToken,
      expiresAt: { $gt: now }, // 令牌未过期
      isUsed: { $ne: true } // 令牌未被使用
    });
    
    if (!resetRequest) {
      return res.status(400).json(ApiResponse.error("无效或已过期的重置密码链接"));
    }
    
    // 更新用户密码
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: newPassword, // 注意：实际环境应使用加密密码
          updatedAt: now
        }
      }
    );
    
    // 标记重置密码令牌为已使用
    await db.collection("userActions").updateOne(
      { _id: resetRequest._id },
      {
        $set: {
          isUsed: true,
          usedAt: now
        }
      }
    );
    
    res.json(ApiResponse.success(null, "密码重置成功，请使用新密码登录"));
  } catch (err) {
    next(err);
  }
};

// GET /user-actions/user-info
// 接口用途：获取用户信息，用于验证登录状态
// 使用场景：
// - 应用启动时检查用户是否已登录
// - 定时验证登录状态有效性
// - 获取当前登录用户的基本信息
// 参数说明：
// - token: 用户登录时获取的token，必填，可通过查询参数或请求头传递
// - 推荐使用请求头：Authorization: Bearer {token}
exports.getUserInfo = async (req, res, next) => {
  // 优先从请求头获取token
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7);
  }
  
  // 如果请求头中没有token，则从查询参数中获取
  if (!token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(400).json(ApiResponse.error("缺少必要参数: token"));
  }
  
  try {
    const db = await connectDB();
    
    // 查找有效的登录记录
    const loginRecord = await db.collection("userActions").findOne({
      action: "login",
      token: token,
      logoutTime: { $exists: false } // 确保未登出
    });
    
    if (!loginRecord) {
      return res.status(401).json(ApiResponse.error("无效的登录状态，请重新登录"));
    }
    
    // 获取用户详细信息
    const user = await db.collection("users").findOne({
      _id: new ObjectId(loginRecord.userId),
      isEnabled: true
    });
    
    if (!user) {
      return res.status(401).json(ApiResponse.error("用户不存在或已禁用"));
    }
    
    // 返回用户信息（不包含敏感信息如密码）
    res.json(ApiResponse.success({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      lastLogin: loginRecord.lastLogin,
      isLoggedIn: true
    }, "获取用户信息成功"));
  } catch (err) {
    next(err);
  }
};

// 引入ObjectId用于MongoDB ID处理
const { ObjectId } = require('mongodb');

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
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  try {
    const db = await connectDB();
    
    // 获取用户删除的题目ID列表
    const deletedActions = await db.collection("userActions").find({
      userId,
      action: "deleted"
    }, {
      projection: { questionId: 1 },
      limit: limitNum,
      skip: skip
    }).toArray();
    
    // 获取总条数用于分页
    const total = await db.collection("userActions").countDocuments({
      userId,
      action: "deleted"
    });
    
    // 如果没有删除的题目，直接返回空列表
    if (deletedActions.length === 0) {
      return res.json(ApiResponse.success({
        questions: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      }));
    }
    
    // 获取题目详情
    const questionIds = deletedActions.map(action => action.questionId);
    const questions = await db.collection("questions").find({
      _id: { $in: questionIds }
    }).toArray();
    
    // 构建返回结果，包含用户操作信息和题目详情
    const result = {
      questions: deletedActions.map(action => {
        const questionDetails = questions.find(q => q._id.toString() === action.questionId.toString());
        return {
          ...action,
          questionDetails
        };
      }),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      }
    };
    
    res.json(ApiResponse.success(result));
  } catch (err) {
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
    return res.status(400).json(ApiResponse.error("缺少必要参数: subjectId"));
  }

  try {
    const db = await connectDB();
    
    // 首先验证科目是否存在
    const subject = await db.collection("subjects").findOne({
      _id: new ObjectId(subjectId)
    });
    
    if (!subject) {
      return res.status(404).json(ApiResponse.error("科目不存在"));
    }
    
    // 更新或插入用户选择的科目记录
    const result = await db.collection("userActions").updateOne(
      {
        userId,
        action: "selected_subject"
      },
      {
        $set: {
          subjectId: new ObjectId(subjectId),
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      {
        upsert: true
      }
    );
    
    const message = result.upsertedCount > 0 ? "科目选择记录创建成功" : "科目选择记录更新成功";
    res.json(ApiResponse.success({
      userId,
      subjectId,
      subjectName: subject.name
    }, message));
  } catch (err) {
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
    const userAction = await db.collection("userActions").findOne(
      { userId, action: "selected_subject" },
      { sort: { updatedAt: -1 } }
    );
    
    if (!userAction) {
      // 如果没有选择记录，返回默认科目（第一个启用的科目）
      const defaultSubject = await db.collection("subjects").findOne({
        isEnabled: true
      });
      
      return res.json(ApiResponse.success(defaultSubject || null));
    }
    
    // 获取科目详情
    const subject = await db.collection("subjects").findOne({
      _id: userAction.subjectId
    });
    
    res.json(ApiResponse.success(subject || null));
  } catch (err) {
    next(err);
  }
};

// POST /user-actions/login
// 接口用途：用户登录
// 使用场景：用户登录应用时调用此接口
// 参数说明：
// - username: 用户名，必填
// - password: 密码，必填
exports.login = async (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json(ApiResponse.error("缺少必要参数: username 和 password"));
  }
  
  try {
    const db = await connectDB();
    
    // 从users集合中查找用户
    const user = await db.collection("users").findOne({
      username,
      isEnabled: true
    });
    
    if (!user) {
      return res.status(401).json(ApiResponse.error("用户名或密码错误"));
    }
    
    // 验证密码（注意：实际生产环境应使用加密密码验证，如bcrypt）
    // 当前版本使用简单比较，后续应升级为密码加密方案
    const isValidPassword = password === user.password;
    
    if (!isValidPassword) {
      return res.status(401).json(ApiResponse.error("用户名或密码错误"));
    }
    
    // 生成登录token
    const now = new Date();
    const token = `token_${user._id}_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 更新用户的登录信息
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: now,
          updatedAt: now
        }
      }
    );
    
    // 记录登录行为
    await db.collection("userActions").insertOne({
      userId: user._id.toString(),
      action: "login",
      username: user.username,
      role: user.role,
      token,
      lastLogin: now,
      createdAt: now
    });
    
    // 返回用户信息和token
    res.json(ApiResponse.success({
      userId: user._id.toString(),
      username: user.username,
      email: user.email || '',
      role: user.role,
      token,
      lastLogin: now
    }, "登录成功"));
  } catch (err) {
    next(err);
  }
};

// POST /user-actions/logout
// 接口用途：用户退出登录
// 使用场景：用户退出应用时调用此接口
// 参数说明：
// - userId: 用户ID，必填
// - token: 用户登录token，必填
exports.logout = async (req, res, next) => {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json(ApiResponse.error("缺少必要参数: userId 和 token"));
  }
  
  try {
    const db = await connectDB();
    
    const now = new Date();
    
    // 记录用户退出登录行为
    await db.collection("userActions").insertOne({
      userId,
      action: "logout",
      token,
      logoutTime: now,
      createdAt: now
    });
    
    // 清除用户的登录token
    await db.collection("userActions").updateMany(
      { userId, action: "login", token },
      {
        $unset: { token: "" },
        $set: { logoutTime: now }
      }
    );
    
    res.json(ApiResponse.success(null, "退出登录成功"));
  } catch (err) {
    next(err);
  }
};
