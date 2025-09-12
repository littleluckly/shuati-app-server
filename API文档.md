# 刷题应用服务端 API 文档

## 项目概述

这是一个基于 Node.js 和 MongoDB 的刷题应用后端服务，提供科目管理、题目管理和用户行为记录等功能。

### 基础信息

- **基础 URL**: `http://localhost:3000`
- **数据库**: MongoDB
- **响应格式**: JSON
- **字符编码**: UTF-8

### 统一响应格式

所有 API 接口都采用统一的响应格式：

```json
{
  "success": true|false,
  "data": null|object|array,
  "message": "操作成功|错误信息"
}
```

---

## 1. 科目管理 API

### 1.1 获取所有科目

**接口地址**: `GET /subjects`

**接口描述**: 获取所有启用状态的科目列表

**请求参数**: 无

**请求示例**:

```
GET http://localhost:3000/subjects
```

**响应示例**:

```
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f789012345",
      "name": "前端开发面试",
      "code": "FE_INTERVIEW",
      "description": "涵盖 JS、CSS、Vue、React 等",
      "tags": [
        { "name": "JavaScript", "type": "language" },
        { "name": "CSS", "type": "style" },
        { "name": "React", "type": "framework" },
        { "name": "Vue", "type": "framework" },
        { "name": "工程化", "type": "tooling" }
      ],
      "userTags": [
        { "name": "面试重点", "type": "priority" },
        { "name": "高频题", "type": "frequency" }
      ],
      "difficultyLevels": ["简单", "中等", "困难"],
      "isEnabled": true,
      "createdAt": "2023-09-01T00:00:00.000Z",
      "updatedAt": "2023-09-01T00:00:00.000Z"
    }
  ],
  "message": "操作成功"
}
```

### 1.2 获取所有科目详细信息

**接口地址**: `GET /subjects/all`

**接口描述**: 获取所有启用状态的科目列表，包含题目统计信息

**请求参数**: 无

**请求示例**:

```
GET http://localhost:3000/subjects/all
```

**响应示例**:

```
{
  "success": true,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f789012345",
      "name": "前端开发面试",
      "code": "FE_INTERVIEW",
      "description": "涵盖 JS、CSS、Vue、React 等",
      "tags": [
        { "name": "JavaScript", "type": "language" },
        { "name": "CSS", "type": "style" },
        { "name": "React", "type": "framework" },
        { "name": "Vue", "type": "framework" },
        { "name": "工程化", "type": "tooling" }
      ],
      "userTags": [
        { "name": "面试重点", "type": "priority" },
        { "name": "高频题", "type": "frequency" }
      ],
      "difficultyLevels": ["简单", "中等", "困难"],
      "isEnabled": true,
      "createdAt": "2023-09-01T00:00:00.000Z",
      "updatedAt": "2023-09-01T00:00:00.000Z",
      "questionCount": 120,
      "difficultyCount": {
        "easy": 40,
        "medium": 50,
        "hard": 30
      }
    }
  ],
  "message": "操作成功"
}
```

**字段说明**:

- `questionCount`: 该科目的题目总数
- `difficultyCount`: 各难度等级的题目数量

### 1.3 根据 ID 获取科目详情

**接口地址**: `GET /subjects/:id`

**接口描述**: 根据科目 ID 获取科目详情

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目 ID |

**请求示例**:

```
GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f789012345",
    "name": "前端开发面试",
    "code": "FE_INTERVIEW",
    "description": "涵盖 JS、CSS、Vue、React 等",
    "tags": [
      { "name": "JavaScript", "type": "language" },
      { "name": "CSS", "type": "style" },
      { "name": "React", "type": "framework" },
      { "name": "Vue", "type": "framework" },
      { "name": "工程化", "type": "tooling" }
    ],
    "userTags": [
      { "name": "面试重点", "type": "priority" },
      { "name": "高频题", "type": "frequency" }
    ],
    "difficultyLevels": ["简单", "中等", "困难"],
    "isEnabled": true,
    "createdAt": "2023-09-01T00:00:00.000Z",
    "updatedAt": "2023-09-01T00:00:00.000Z"
  },
  "message": "操作成功"
}
```

**错误响应**:

```
{"success": false, "data": null, "message": "科目不存在"}
```

### 1.4 根据科目 ID 获取所有标签

**接口地址**: `GET /subjects/:id/tags`

**接口描述**: 根据科目 ID 获取该科目下的所有标签列表

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目 ID |

**请求示例**:

```
GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/tags
```

**响应示例**:

```
{
  "success": true,
  "data": [
    { "name": "JavaScript", "type": "language" },
    { "name": "CSS", "type": "style" },
    { "name": "React", "type": "framework" },
    { "name": "Vue", "type": "framework" },
    { "name": "工程化", "type": "tooling" }
  ],
  "message": "操作成功"
}
```

### 1.5 根据科目 ID 获取标签计数

**接口地址**: `GET /subjects/:id/tags-count`

**接口描述**: 根据科目 ID 获取该科目下的标签统计信息

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目 ID |

**请求示例**:

```
GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/tags-count
```

**响应示例**:

```
{
  "success": true,
  "data": [
    { "name": "JavaScript", "count": 45 },
    { "name": "CSS", "count": 30 },
    { "name": "React", "count": 25 },
    { "name": "Vue", "count": 20 },
    { "name": "工程化", "count": 15 }
  ],
  "message": "操作成功"
}
```

**字段说明**:

- `count`: 该标签下的题目数量

---

## 2. 题目管理 API

### 2.1 随机获取题目

**接口地址**: `GET /questions/random`

**接口描述**: 随机获取一道题目

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| subjectId | string | query | 否 | 科目 ID |
| difficulty | string | query | 否 | 难度等级：easy、medium、hard |
| excludeIds | string | query | 否 | 排除的题目 ID，多个用逗号分隔 |
| tags | string | query | 否 | 标签过滤，多个用逗号分隔 |

**请求示例**:

```
# 获取任意一道题目
GET http://localhost:3000/questions/random

# 获取指定科目的题目
GET http://localhost:3000/questions/random?subjectId=64f1a2b3c4d5e6f789012345

# 获取指定难度的题目
GET http://localhost:3000/questions/random?difficulty=medium

# 获取指定标签的题目
GET http://localhost:3000/questions/random?tags=javascript,react
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f789012346",
    "id": "285acd89-b79b-49e6-8425-5d60d5101233",
    "type": "choice",
    "difficulty": "easy",
    "tags": ["vue", "lifecycle"],
    "question_markdown": "Vue 2.x 生命周期有哪些？分别做了什么？",
    "answer_simple_markdown": "beforeCreate → created → beforeMount → mounted...",
    "answer_analysis_markdown": "详细解析内容...",
    "files": {
      "audio_simple": "path/to/audio_simple.mp3",
      "audio_question": "path/to/audio_question.mp3",
      "audio_analysis": "path/to/audio_analysis.mp3",
      "meta": "path/to/meta.json"
    },
    "subjectId": "64f1a2b3c4d5e6f789012345",
    "question_length": 25,
    "simple_answer_length": 120,
    "detailed_analysis_length": 500,
    "created_at": "2023-09-01T10:00:00.000Z"
  },
  "message": "操作成功"
}
```

**错误响应**:

```
{"success": false, "data": null, "message": "暂无符合条件的题目"}
```

### 2.2 随机获取题目列表

**接口地址**: `POST /questions/random-list`

**接口描述**: 随机获取指定数量的题目列表

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| subjectId | string | body | 否 | 科目 ID |
| total | number | body | 否 | 题目数量，默认 10，最大 50 |
| difficultyConfig | object | body | 否 | 难度分布配置，例如：{"easy": 0.4, "medium": 0.4, "hard": 0.2} |
| excludeIds | array | body | 否 | 排除的题目 ID 数组 |
| tags | array | body | 否 | 标签过滤数组 |

**请求示例**:

```
# 随机获取 10 道题目
POST http://localhost:3000/questions/random-list
Content-Type: application/json

{}

# 随机获取指定科目的 20 道题目
POST http://localhost:3000/questions/random-list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "total": 20
}

# 自定义难度分布
POST http://localhost:3000/questions/random-list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "total": 20,
  "difficultyConfig": {
    "easy": 0.3,
    "medium": 0.5,
    "hard": 0.2
  }
}

# 按标签过滤
POST http://localhost:3000/questions/random-list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "tags": ["vue", "javascript"]
}
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "64f1a2b3c4d5e6f789012346",
        "id": "285acd89-b79b-49e6-8425-5d60d5101233",
        "type": "choice",
        "difficulty": "easy",
        "tags": ["vue", "lifecycle"],
        "question_markdown": "Vue 2.x 生命周期有哪些？分别做了什么？",
        "answer_simple_markdown": "beforeCreate → created → beforeMount → mounted...",
        "answer_analysis_markdown": "详细解析内容...",
        "files": {
          "audio_simple": "path/to/audio_simple.mp3",
          "audio_question": "path/to/audio_question.mp3",
          "audio_analysis": "path/to/audio_analysis.mp3",
          "meta": "path/to/meta.json"
        },
        "subjectId": "64f1a2b3c4d5e6f789012345",
        "question_length": 25,
        "simple_answer_length": 120,
        "detailed_analysis_length": 500,
        "created_at": "2023-09-01T10:00:00.000Z"
      }
      // 更多题目...
    ],
    "stats": {
      "total": 10,
      "easy": 4,
      "medium": 4,
      "hard": 2,
      "tags": {
        "vue": 6,
        "javascript": 5,
        "react": 3
      }
    }
  },
  "message": "操作成功"
}
```

**错误响应**:

```
{"success": false, "data": null, "message": "暂无符合条件的题目"}
```

### 2.3 获取过滤的题目列表

**接口地址**: `POST /questions/list`

**接口描述**: 根据条件过滤题目并返回分页列表

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| subjectId | string | body | 否 | 科目 ID |
| difficulty | array | body | 否 | 难度等级数组，例如：["easy", "medium"] |
| tags | array | body | 否 | 标签数组，例如：["vue", "javascript"] |
| page | number | body | 否 | 页码，默认 1 |
| limit | number | body | 否 | 每页数量，默认 20，最大 50 |

**请求示例**:

```
# 获取所有题目（分页）
POST http://localhost:3000/questions/list
Content-Type: application/json

{
  "page": 1,
  "limit": 10
}

# 根据条件过滤题目
POST http://localhost:3000/questions/list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "difficulty": ["easy", "medium"],
  "tags": ["vue", "javascript"],
  "page": 1,
  "limit": 10
}
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "64f1a2b3c4d5e6f789012346",
        "id": "285acd89-b79b-49e6-8425-5d60d5101233",
        "type": "choice",
        "difficulty": "easy",
        "tags": ["vue", "lifecycle"],
        "question_markdown": "Vue 2.x 生命周期有哪些？分别做了什么？",
        "answer_simple_markdown": "beforeCreate → created → beforeMount → mounted...",
        "answer_analysis_markdown": "详细解析内容...",
        "files": {
          "audio_simple": "path/to/audio_simple.mp3",
          "audio_question": "path/to/audio_question.mp3",
          "audio_analysis": "path/to/audio_analysis.mp3",
          "meta": "path/to/meta.json"
        },
        "subjectId": "64f1a2b3c4d5e6f789012345",
        "question_length": 25,
        "simple_answer_length": 120,
        "detailed_analysis_length": 500,
        "created_at": "2023-09-01T10:00:00.000Z"
      }
      // 更多题目...
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 120,
      "totalPages": 12,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "message": "操作成功"
}
```

**错误响应**:

```
{"success": false, "data": null, "message": "暂无符合条件的题目"}
```

### 2.4 根据 ID 获取题目详情

**接口地址**: `GET /questions/:id`

**接口描述**: 根据题目 ID 获取题目详情

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 题目 ID |

**请求示例**:

```
GET http://localhost:3000/questions/64f1a2b3c4d5e6f789012346
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f789012346",
    "id": "285acd89-b79b-49e6-8425-5d60d5101233",
    "type": "choice",
    "difficulty": "easy",
    "tags": ["vue", "lifecycle"],
    "question_markdown": "Vue 2.x 生命周期有哪些？分别做了什么？",
    "answer_simple_markdown": "beforeCreate → created → beforeMount → mounted...",
    "answer_analysis_markdown": "详细解析内容...",
    "files": {
      "audio_simple": "path/to/audio_simple.mp3",
      "audio_question": "path/to/audio_question.mp3",
      "audio_analysis": "path/to/audio_analysis.mp3",
      "meta": "path/to/meta.json"
    },
    "subjectId": "64f1a2b3c4d5e6f789012345",
    "question_length": 25,
    "simple_answer_length": 120,
    "detailed_analysis_length": 500,
    "created_at": "2023-09-01T10:00:00.000Z"
  },
  "message": "操作成功"
}
```

**错误响应**:

```
{"success": false, "data": null, "message": "题目不存在"}
```

---

## 3. 用户行为记录 API

### 3.1 记录用户行为

**接口地址**: `POST /user-actions`

**接口描述**: 记录用户的操作行为，包括收藏和删除等

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| userId | string | body | 否 | 用户 ID，默认为 "guest" |
| questionId | string | body | 是 | 题目 ID |
| action | string | body | 是 | 行为类型：favorited、deleted |

**请求示例**:

```
POST http://localhost:3000/user-actions
Content-Type: application/json

{
  "userId": "user123",
  "questionId": "64f1a2b3c4d5e6f789012346",
  "action": "favorited"
}
```

**响应示例**:

```
{
  "success": true,
  "data": null,
  "message": "记录成功"
}
```

**错误响应**:

```
{
  "success": false,
  "data": null,
  "message": "无效的行为类型，支持的行为类型：favorited、deleted"
}
```

或

```
{
  "success": false,
  "data": null,
  "message": "缺少必要参数"
}
```

### 3.2 获取用户统计数据

**接口地址**: `GET /user-actions/stats`

**接口描述**: 获取指定用户的答题统计信息

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| userId | string | query | 否 | 用户 ID，默认为 "guest" |

**请求示例**:

```
# 获取默认用户统计
GET http://localhost:3000/user-actions/stats

# 获取指定用户统计
GET http://localhost:3000/user-actions/stats?userId=user123
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "favorited": 15,
    "deleted": 8,
    "total": 23
  },
  "message": "操作成功"
}
```

**字段说明**:

- `favorited`: 用户收藏的题目总数
- `deleted`: 用户删除的题目总数
- `total`: 总行为记录数

---

### 3.3 重置用户删除的题目记录 (开发专用)

**接口地址**: `POST /user-actions/reset-deleted`

**接口描述**: 重置指定用户删除的题目记录，仅在开发环境中可用

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| userId | string | body | 否 | 用户 ID，默认为 "guest" |

**请求示例**:

```
# 重置默认用户删除的题目记录
POST http://localhost:3000/user-actions/reset-deleted
Content-Type: application/json

{}

# 重置指定用户删除的题目记录
POST http://localhost:3000/user-actions/reset-deleted
Content-Type: application/json

{
  "userId": "user123"
}
```

**响应示例**:

```
{
  "success": true,
  "data": null,
  "message": "成功重置 5 条删除记录"
}
```

**错误响应**:

```
{
  "success": false,
  "data": null,
  "message": "Forbidden: Development endpoint only"
}
```

---

### 3.4 恢复用户删除的题目

**接口地址**: `POST /user-actions/undelete`

**接口描述**: 恢复用户删除的题目，支持单个或批量恢复

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| userId | string | body | 否 | 用户 ID，默认为 "guest" |
| questionIds | string/array | body | 是 | 要恢复的题目 ID 或 ID 数组 |

**请求示例**:

```
# 恢复单个题目
POST http://localhost:3000/user-actions/undelete
Content-Type: application/json

{
  "userId": "user123",
  "questionIds": "64f1a2b3c4d5e6f789012346"
}

# 批量恢复题目
POST http://localhost:3000/user-actions/undelete
Content-Type: application/json

{
  "userId": "user123",
  "questionIds": [
    "64f1a2b3c4d5e6f789012346",
    "64f1a2b3c4d5e6f789012347",
    "64f1a2b3c4d5e6f789012348"
  ]
}
```

**响应示例**:

```
{
  "success": true,
  "data": null,
  "message": "成功恢复 3 道题目"
}
```

**错误响应**:

```
{
  "success": false,
  "data": null,
  "message": "缺少必要参数: questionIds"
}
```

---

### 3.5 获取用户删除的题目列表

**接口地址**: `POST /user-actions/deleted-questions`

**接口描述**: 获取用户删除的题目列表，支持分页

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| userId | string | body | 否 | 用户 ID，默认为 "guest" |
| page | number | body | 否 | 页码，默认 1 |
| limit | number | body | 否 | 每页数量，默认 20 |

**请求示例**:

```
# 获取默认用户删除的题目列表
POST http://localhost:3000/user-actions/deleted-questions
Content-Type: application/json

{}

# 获取指定用户删除的题目列表
POST http://localhost:3000/user-actions/deleted-questions
Content-Type: application/json

{
  "userId": "user123",
  "page": 1,
  "limit": 10
}
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "64f1a2b3c4d5e6f789012349",
        "userId": "user123",
        "questionId": "64f1a2b3c4d5e6f789012346",
        "action": "deleted",
        "createdAt": "2023-09-01T10:00:00.000Z",
        "questionDetails": {
          "_id": "64f1a2b3c4d5e6f789012346",
          "id": "285acd89-b79b-49e6-8425-5d60d5101233",
          "type": "choice",
          "difficulty": "easy",
          "tags": ["vue", "lifecycle"],
          "question_markdown": "Vue 2.x 生命周期有哪些？分别做了什么？",
          "answer_simple_markdown": "beforeCreate → created → beforeMount → mounted...",
          "subjectId": "64f1a2b3c4d5e6f789012345"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "message": "操作成功"
}
```

### 3.6 记录用户选择的科目

**接口地址**: `POST /user-actions/select-subject`

**接口描述**: 记录用户选择的科目，支持用户切换科目时更新记录

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| userId | string | body | 否 | 用户 ID，默认为 "guest" |
| subjectId | string | body | 是 | 科目 ID |

**请求示例**:

```
# 记录默认用户选择的科目
POST http://localhost:3000/user-actions/select-subject
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345"
}

# 记录指定用户选择的科目
POST http://localhost:3000/user-actions/select-subject
Content-Type: application/json

{
  "userId": "user123",
  "subjectId": "64f1a2b3c4d5e6f789012345"
}
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "userId": "user123",
    "subjectId": "64f1a2b3c4d5e6f789012345",
    "subjectName": "前端开发面试"
  },
  "message": "科目选择记录更新成功"
}
```

**错误响应**:

```
{"success": false, "data": null, "message": "缺少必要参数: subjectId"}
```

或

```
{"success": false, "data": null, "message": "科目不存在"}
```

### 3.7 获取用户当前选择的科目

**接口地址**: `GET /user-actions/current-subject`

**接口描述**: 获取用户当前选择的科目，如果没有选择记录则返回默认科目

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| userId | string | query | 否 | 用户 ID，默认为 "guest" |

**请求示例**:

```
# 获取默认用户当前选择的科目
GET http://localhost:3000/user-actions/current-subject

# 获取指定用户当前选择的科目
GET http://localhost:3000/user-actions/current-subject?userId=user123
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f789012345",
    "name": "前端开发面试",
    "code": "FE_INTERVIEW",
    "description": "涵盖 JS、CSS、Vue、React 等",
    "tags": [
      { "name": "JavaScript", "value": "javascript" },
      { "name": "CSS", "value": "css" },
      { "name": "React", "value": "react" },
      { "name": "Vue", "value": "vue" },
      { "name": "工程化", "value": "engineering" }
    ],
    "userTags": [],
    "difficultyLevels": [
      { "name": "简单", "value": "easy" },
      { "name": "中等", "value": "medium" },
      { "name": "困难", "value": "hard" }
    ],
    "isEnabled": true,
    "createdAt": "2023-09-01T00:00:00.000Z",
    "updatedAt": "2023-09-01T00:00:00.000Z"
  },
  "message": "操作成功"
}
```

**字段说明**:

- 返回科目对象包含所有科目相关信息，与 `/subjects` 接口返回的科目格式一致
- 如果用户没有选择科目记录，将返回第一个启用的默认科目
- 如果没有启用的科目，将返回 `null`

### 3.8 用户登录

**接口地址**: `POST /user-actions/login`

**接口描述**: 用户登录，获取用户身份认证信息和token

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| username | string | body | 是 | 用户名 |
| password | string | body | 是 | 密码 |

**请求示例**:

```
POST http://localhost:3000/user-actions/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**:

```
{
  "success": true,
  "data": {
    "userId": "64f1a2b3c4d5e6f789012347",
    "username": "admin",
    "role": "admin",
    "token": "token_64f1a2b3c4d5e6f789012347_1622544000000_abc123def456",
    "lastLogin": "2021-06-01T10:00:00.000Z"
  },
  "message": "登录成功"
}
```

**错误响应**:

```
{"success": false, "data": null, "message": "缺少必要参数: username 和 password"}
```

或

```
{"success": false, "data": null, "message": "用户名或密码错误"}
```

### 3.9 用户退出登录

**接口地址**: `POST /user-actions/logout`

**接口描述**: 用户退出登录，清除用户身份认证信息

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| userId | string | body | 是 | 用户ID |
| token | string | body | 是 | 用户登录时获取的token |

**请求示例**:

```
POST http://localhost:3000/user-actions/logout
Content-Type: application/json

{
  "userId": "64f1a2b3c4d5e6f789012347",
  "token": "token_64f1a2b3c4d5e6f789012347_1622544000000_abc123def456"
}
```

**响应示例**:

```
{
  "success": true,
  "data": null,
  "message": "退出登录成功"
}
```

**错误响应**:

```
{"success": false, "data": null, "message": "缺少必要参数: userId 和 token"}
```

### 3.10 获取用户信息

**接口地址**: `GET /user-actions/user-info`

**接口描述**: 获取用户信息，用于判断用户是否已登录及验证登录状态有效性

**使用场景**:
- 应用启动时检查用户是否已登录
- 定时验证登录状态有效性
- 获取当前登录用户的基本信息

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| token | string | query/header | 是 | 用户登录时获取的token，推荐使用请求头：Authorization: Bearer {token} |

**请求示例** (使用查询参数):

```
GET http://localhost:3000/user-actions/user-info?token=token_64f1a2b3c4d5e6f789012347_1622544000000_abc123def456
```

**请求示例** (使用请求头):

```
GET http://localhost:3000/user-actions/user-info
Authorization: Bearer token_64f1a2b3c4d5e6f789012347_1622544000000_abc123def456
```

**响应示例** (已登录):

```
{
  "success": true,
  "data": {
    "userId": "64f1a2b3c4d5e6f789012347",
    "username": "admin",
    "role": "admin",
    "lastLogin": "2021-06-01T10:00:00.000Z",
    "isLoggedIn": true
  },
  "message": "获取用户信息成功"
}
```

**错误响应** (token缺失):

```
{"success": false, "data": null, "message": "缺少必要参数: token"}
```

**错误响应** (无效的登录状态):

```
{"success": false, "data": null, "message": "无效的登录状态，请重新登录"}
```

---

## 4. 状态码说明

| HTTP 状态码 | 说明           |
| ----------- | -------------- |
| 200         | 请求成功       |
| 400         | 请求参数错误   |
| 404         | 资源不存在     |
| 500         | 服务器内部错误 |

---

## 5. 错误处理

所有 API 接口在发生错误时都会返回统一格式的错误响应：

```
{
  "success": false,
  "data": null,
  "message": "具体错误信息"
}
```

常见错误信息：

- "缺少必要参数"
- "无效的行为类型"
- "科目不存在"
- "暂无符合条件的题目"
- "服务器错误"

---

## 6. 数据模型

### 6.1 科目 (Subject)

```
{
  "_id": "ObjectId",
  "name": "科目名称",
  "code": "科目代码",
  "description": "科目描述",
  "tags": [
    {
      "name": "标签名称",
      "type": "标签类型"
    }
  ],
  "difficultyLevels": ["简单", "中等", "困难"],
  "isEnabled": true,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 6.2 题目 (Question)

```
{
  "_id": "ObjectId",
  "id": "题目唯一标识",
  "type": "题目类型",
  "difficulty": "难度等级",
  "tags": ["标签数组"],
  "question_markdown": "题目内容",
  "answer_simple_markdown": "简答内容",
  "answer_analysis_markdown": "详细解析",
  "files": {
    "audio_simple": "简答音频文件",
    "audio_question": "题目音频文件",
    "audio_analysis": "解析音频文件",
    "meta": "元数据文件"
  },
  "subjectId": "ObjectId",
  "question_length": "Number",
  "simple_answer_length": "Number",
  "detailed_analysis_length": "Number",
  "created_at": "Date"
}
```

### 6.3 用户 (User)

```
{
  "_id": "ObjectId",
  "username": "用户名",
  "password": "密码",
  "role": "用户角色",
  "isEnabled": true,
  "lastLogin": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 6.4 用户行为 (UserAction)

```
{
  "_id": "ObjectId",
  "userId": "用户ID",
  "questionId": "ObjectId",
  "action": "favorited|deleted|selected_subject|login|logout",
  "username": "用户名",
  "role": "用户角色",
  "token": "认证token",
  "logoutTime": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 7. 开发环境配置

### 7.1 启动服务

```
# 安装依赖
npm install

# 启动服务
npm start
```

### 7.2 初始化数据库

```
# 运行数据库初始化脚本
node init-db.js
```

### 7.3 环境变量

创建 `.env` 文件并配置：

```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=shuati
```

---

## 8. 示例代码

### 8.1 JavaScript/Fetch 示例

```
// 获取科目列表
async function getSubjects() {
  const response = await fetch("http://localhost:3000/subjects");
  const result = await response.json();
  console.log(result);
}

// 获取所有科目详细信息
async function getAllSubjects() {
  const response = await fetch("http://localhost:3000/subjects/all");
  const result = await response.json();
  console.log(result);
}

// 根据科目 ID 获取标签
async function getTagsBySubjectId(subjectId) {
  const response = await fetch(
    `http://localhost:3000/subjects/${subjectId}/tags`
  );
  const result = await response.json();
  console.log(result);
}

// 获取随机题目
async function getRandomQuestion(subjectId, difficulty) {
  const params = new URLSearchParams();
  if (subjectId) params.append("subjectId", subjectId);
  if (difficulty) params.append("difficulty", difficulty);

  const response = await fetch(
    `http://localhost:3000/questions/random?${params}`
  );
  const result = await response.json();
  console.log(result);
}

// 获取随机题目列表
async function getRandomQuestionList(subjectId, options = {}) {
  const requestBody = {
    subjectId,
    ...options,
  };

  const response = await fetch("http://localhost:3000/questions/random-list", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  const result = await response.json();
  console.log(result);
}

// 获取过滤的题目列表
async function getFilteredQuestionList(filters = {}) {
  const requestBody = {
    page: 1,
    limit: 20,
    ...filters,
  };

  const response = await fetch("http://localhost:3000/questions/list", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  const result = await response.json();
  console.log(result);
}

// 记录用户行为
async function recordAction(userId, questionId, action) {
  const response = await fetch("http://localhost:3000/user-actions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      questionId,
      action: "favorited",
    }),
  });
  const result = await response.json();
  console.log(result);
}

// 记录用户选择的科目
async function selectSubject(userId, subjectId) {
  const response = await fetch("http://localhost:3000/user-actions/select-subject", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      subjectId,
    }),
  });
  const result = await response.json();
  console.log(result);
}

// 获取用户当前选择的科目
async function getCurrentSubject(userId) {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  
  const response = await fetch(
    `http://localhost:3000/user-actions/current-subject?${params}`
  );
  const result = await response.json();
  console.log(result);
}

// 用户登录
async function login(username, password) {
  const response = await fetch("http://localhost:3000/user-actions/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });
  const result = await response.json();
  console.log(result);
}

// 用户退出登录
async function logout(userId, token) {
  const response = await fetch("http://localhost:3000/user-actions/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      token
    }),
  });
  const result = await response.json();
  console.log(result);
}

// 获取用户信息（通过查询参数传递token）
async function getUserInfoByQuery(token) {
  const response = await fetch(`http://localhost:3000/user-actions/user-info?token=${token}`);
  const result = await response.json();
  console.log(result);
}

// 获取用户信息（通过请求头传递token）
async function getUserInfoByHeader(token) {
  const response = await fetch("http://localhost:3000/user-actions/user-info", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  const result = await response.json();
  console.log(result);
}
```

### 8.2 cURL 示例

```
# 获取科目列表
curl -X GET http://localhost:3000/subjects

# 获取所有科目详细信息
curl -X GET http://localhost:3000/subjects/all

# 根据科目 ID 获取标签
curl -X GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/tags

# 获取随机题目
curl -X GET "http://localhost:3000/questions/random?difficulty=中等"

# 获取随机题目列表（默认配置）
curl -X POST http://localhost:3000/questions/random-list \
  -H "Content-Type: application/json" \
  -d '{"subjectId":"64f1a2b3c4d5e6f789012345"}'

# 获取随机题目列表（自定义雾度分布）
curl -X POST http://localhost:3000/questions/random-list \
  -H "Content-Type: application/json" \
  -d '{"subjectId":"64f1a2b3c4d5e6f789012345","total":20,"difficultyConfig":{"easy":0.5,"medium":0.3,"hard":0.2}}'

# 获取过滤的题目列表
curl -X POST http://localhost:3000/questions/list \
  -H "Content-Type: application/json" \
  -d '{"subjectId":"64f1a2b3c4d5e6f789012345","difficulty":["easy","medium"],"tags":["vue","javascript"],"page":1,"limit":10}'

# 记录用户行为
curl -X POST http://localhost:3000/user-actions \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","questionId":"64f1a2b3c4d5e6f789012346","action":"favorited"}'

# 记录用户选择的科目
curl -X POST http://localhost:3000/user-actions/select-subject \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","subjectId":"64f1a2b3c4d5e6f789012345"}'

# 获取用户当前选择的科目
curl -X GET "http://localhost:3000/user-actions/current-subject?userId=user123"

# 获取用户统计
curl -X GET "http://localhost:3000/user-actions/stats?userId=user123"

# 用户登录
curl -X POST http://localhost:3000/user-actions/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","password":"123456"}'

# 用户退出登录
curl -X POST http://localhost:3000/user-actions/logout \
  -H "Content-Type: application/json" \
  -d '{"userId":"64f1a2b3c4d5e6f789012347","token":"token_64f1a2b3c4d5e6f789012347_1622544000000_abc123def456"}'

# 获取用户信息（通过查询参数传递token）
curl -X GET "http://localhost:3000/user-actions/user-info?token=token_64f1a2b3c4d5e6f789012347_1622544000000_abc123def456"

# 获取用户信息（通过请求头传递token）
curl -X GET http://localhost:3000/user-actions/user-info \
  -H "Authorization: Bearer token_64f1a2b3c4d5e6f789012347_1622544000000_abc123def456"
```

---

## 9. 更新日志

### v1.8.0 (2024-05-25)

- 新增获取用户信息接口 (`GET /user-actions/user-info`)
- 支持通过查询参数或请求头（Authorization: Bearer）传递token
- 用于判断用户是否已登录及验证登录状态有效性
- 在示例代码中添加获取用户信息的使用示例

### v1.7.0 (2024-05-24)

- 新增用户登录接口 (`POST /user-actions/login`)
- 新增用户退出登录接口 (`POST /user-actions/logout`)
- 新增users集合，支持用户身份认证
- 更新userActionController.js中的login和logout函数，使用users集合进行认证
- 更新用户行为数据模型，支持用户登录状态管理
- 在示例代码中添加登录和退出登录的使用示例
- 在API文档中添加用户(User)数据模型定义
- 在init-db.js中添加users集合初始化和默认管理员用户创建

### v1.6.0 (2024-05-23)

- 新增记录用户选择科目的接口 (`POST /user-actions/select-subject`)
- 新增获取用户当前选择科目的接口 (`GET /user-actions/current-subject`)
- 更新用户行为数据模型，添加 `updatedAt` 字段和 `selected_subject` 行为类型
- 添加相关示例代码

### v1.5.0 (2024-05-22)

- 修改根据科目 ID 获取标签接口名称为 getTagCountBySubjectId
- 新增根据科目 ID 获取所有标签接口（不带统计）

### v1.4.0 (2024-05-21)

- 更新用户行为类型为英文：favorited、deleted
- 更新相关文档和示例代码

### v1.3.0

- 新增过滤的题目列表 API (`POST /questions/list`)
- 支持按科目、雾度和多个标签过滤
- 支持多个雾度等级过滤（数组支持）
- 支持分页显示
- 支持组合过滤条件

### v1.1.0

- 新增获取所有科目详细信息 API (`GET /subjects/all`)
- 新增根据科目 ID 获取标签 API (`GET /subjects/:id/tags-count`)
- 新增随机获取题目列表 API (`POST /questions/random-list`)
- 支持自定义难度分布配置
- 支持按标签过滤题目
- 支持题目数量统计信息

### v1.0.0

- 实现科目管理 API
- 实现题目随机获取 API
- 实现用户行为记录 API
- 实现用户统计数据 API
- 支持从 meta.json 文件批量导入题目数据
