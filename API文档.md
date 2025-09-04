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

```bash
GET http://localhost:3000/subjects
```

**响应示例**:

```json
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

```bash
GET http://localhost:3000/subjects/all
```

**响应示例**:

```json
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
      "questionStats": {
        "total": 25,
        "byDifficulty": {
          "easy": 10,
          "medium": 10,
          "hard": 5
        }
      }
    }
  ],
  "message": "操作成功"
}
```

### 1.3 根据 ID 获取科目详情

**接口地址**: `GET /subjects/:id`

**接口描述**: 根据科目 ID 获取科目详细信息

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目的 ObjectId |

**请求示例**:

```bash
GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f789012345",
    "name": "前端开发面试",
    "code": "FE_INTERVIEW",
    "description": "涵盖 JS、CSS、Vue、React 等",
    "tags": [
      { "name": "JavaScript", "type": "language" },
      { "name": "CSS", "type": "style" }
    ],
    "userTags": [{ "name": "面试重点", "type": "priority" }],
    "difficultyLevels": ["简单", "中等", "困难"],
    "isEnabled": true,
    "createdAt": "2023-09-01T00:00:00.000Z",
    "updatedAt": "2023-09-01T00:00:00.000Z"
  },
  "message": "操作成功"
}
```

**错误响应**:

```json
{
  "success": false,
  "data": null,
  "message": "科目不存在"
}
```

### 1.4 根据科目 ID 获取所有标签计数

**接口地址**: `GET /subjects/:id/tags-count`

**接口描述**: 根据科目 ID 获取该科目下所有题目的标签及其数量统计

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目的 ObjectId |

**请求示例**:

```bash
GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/tags
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "name": "vue",
      "count": 15
    },
    {
      "name": "javascript",
      "count": 12
    },
    {
      "name": "lifecycle",
      "count": 8
    },
    {
      "name": "reactivity",
      "count": 6
    }
  ],
  "message": "操作成功"
}
```

**错误响应**:

```json
{
  "success": false,
  "data": null,
  "message": "科目不存在"
}
```

### 1.5 根据科目 ID 获取所有标签

**接口地址**: `GET /subjects/:id/all-tags`

**接口描述**: 根据科目 ID 获取该科目下所有题目的标签，不包含数量统计

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目的 ObjectId |

**请求示例**:

```bash
GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/all-tags
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "name": "JavaScript",
      "value": "javascript"
    },
    {
      "name": "CSS",
      "value": "css"
    },
    {
      "name": "React",
      "value": "react"
    },
    {
      "name": "Vue",
      "value": "vue"
    }
  ],
  "message": "操作成功"
}
```

**错误响应**:

```json
{
  "success": false,
  "data": null,
  "message": "科目不存在"
}
```

### 1.6 添加用户自定义标签

**接口地址**: `POST /subjects/:id/user-tags`

**接口描述**: 为指定科目添加用户自定义标签，内置标签不可修改

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目的 ObjectId |
| name | string | body | 是 | 标签名称 |
| type | string | body | 否 | 标签类型，默认为 "custom" |

**请求示例**:

```bash
POST http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/user-tags
Content-Type: application/json

{
  "name": "面试重点",
  "type": "priority"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": null,
  "message": "标签添加成功"
}
```

**错误响应**:

```json
{
  "success": false,
  "data": null,
  "message": "标签名称不能为空"
}
```

### 1.6 修改用户自定义标签

**接口地址**: `PUT /subjects/:id/user-tags/:tagName`

**接口描述**: 修改指定科目的用户自定义标签，内置标签不可修改

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目的 ObjectId |
| tagName | string | path | 是 | 原标签名称 |
| newName | string | body | 是 | 新标签名称 |
| type | string | body | 否 | 新标签类型 |

**请求示例**:

```bash
PUT http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/user-tags/面试重点
Content-Type: application/json

{
  "newName": "必考题",
  "type": "priority"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": null,
  "message": "标签修改成功"
}
```

**错误响应**:

```json
{
  "success": false,
  "data": null,
  "message": "只能修改用户自定义标签"
}
```

### 1.7 删除用户自定义标签

**接口地址**: `DELETE /subjects/:id/user-tags/:tagName`

**接口描述**: 删除指定科目的用户自定义标签，内置标签不可删除，同时会从该科目下的所有题目中移除该标签

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目的 ObjectId |
| tagName | string | path | 是 | 要删除的标签名称 |

**请求示例**:

```bash
DELETE http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/user-tags/面试重点
```

**响应示例**:

```json
{
  "success": true,
  "data": null,
  "message": "标签删除成功"
}
```

**错误响应**:

```json
{
  "success": false,
  "data": null,
  "message": "只能删除用户自定义标签"
}
```

---

## 2. 题目管理 API

### 2.1 随机获取题目

**接口地址**: `GET /questions/random`

**接口描述**: 根据指定条件随机获取一道题目

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| subjectId | string | query | 否 | 科目 ID，筛选指定科目的题目 |
| difficulty | string | query | 否 | 难度等级：简单、中等、困难 |

**请求示例**:

```
# 获取任意题目
GET http://localhost:3000/questions/random

# 获取指定科目的题目
GET http://localhost:3000/questions/random?subjectId=64f1a2b3c4d5e6f789012345

# 获取指定难度的题目
GET http://localhost:3000/questions/random?difficulty=中等

# 获取指定科目和难度的题目
GET http://localhost:3000/questions/random?subjectId=64f1a2b3c4d5e6f789012345&difficulty=简单
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
    "question_length": 23,
    "simple_answer_length": 189,
    "detailed_analysis_length": 347,
    "created_at": null,
    "question_markdown": "Vue 2.x 生命周期有哪些？分别做了什么？",
    "answer_simple_markdown": "beforeCreate → created → beforeMount → mounted → beforeUpdate → updated → beforeDestroy → destroyed",
    "answer_analysis_markdown": "- beforeCreate：实例刚初始化，data、methods 均不可用。\n- created：实例创建完成，可访问/修改数据，但 DOM 未生成...",
    "files": {
      "audio_simple": "q0001_285acd89_audio_simple.mp3",
      "audio_question": "q0001_285acd89_audio_question.mp3",
      "audio_analysis": "q0001_285acd89_audio_analysis.mp3",
      "meta": "q0001_285acd89_meta.json"
    },
    "subjectId": "64f1a2b3c4d5e6f789012345"
  },
  "message": "操作成功"
}
```

**错误响应**:

```
{
  "success": false,
  "data": null,
  "message": "暂无符合条件的题目"
}
```

### 2.2 随机获取题目列表

**接口地址**: `POST /questions/random-list`

**接口描述**: 根据指定配置随机获取某个科目下的题目列表，支持难度分布和标签过滤

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| subjectId | string | body | 是 | 科目 ID |
| total | number | body | 否 | 题目总数，默认 10 |
| difficultyConfig | object | body | 否 | 难度分布配置 |
| tagConfig | object | body | 否 | 标签配置 |

**难度分布配置说明**:

```
{
  "easy": 0.4, // 40% 简单题
  "medium": 0.4, // 40% 中等题
  "hard": 0.2 // 20% 困难题
}
```

**标签配置说明**:

```
{
  "vue": 5, // vue 标签的题目 5 道
  "javascript": 3 // javascript 标签的题目 3 道
}
```

**请求示例**:

```
# 获取默认配置的 10 道题
POST http://localhost:3000/questions/random-list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345"
}

# 获取 20 道题，自定义难度分布
POST http://localhost:3000/questions/random-list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "total": 20,
  "difficultyConfig": {
    "easy": 0.5,
    "medium": 0.3,
    "hard": 0.2
  }
}

# 获取指定标签的题目
POST http://localhost:3000/questions/random-list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "total": 15,
  "tagConfig": {
    "vue": 8,
    "javascript": 7
  }
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
        "answer_simple_markdown": "beforeCreate → created → beforeMount → mounted → beforeUpdate → updated → beforeDestroy → destroyed",
        "answer_analysis_markdown": "- beforeCreate：实例刚初始化，data、methods 均不可用。\n- created：实例创建完成...",
        "files": {
          "audio_simple": "q0001_285acd89_audio_simple.mp3",
          "audio_question": "q0001_285acd89_audio_question.mp3",
          "audio_analysis": "q0001_285acd89_audio_analysis.mp3",
          "meta": "q0001_285acd89_meta.json"
        },
        "subjectId": "64f1a2b3c4d5e6f789012345"
      }
      // ... 更多题目
    ],
    "total": 10,
    "config": {
      "requestedTotal": 10,
      "difficultyConfig": {
        "easy": 0.4,
        "medium": 0.4,
        "hard": 0.2
      },
      "tagConfig": null
    }
  },
  "message": "操作成功"
}
```

**错误响应**:

```
{
  "success": false,
  "data": null,
  "message": "缺少科目 ID 参数"
}
```

### 2.3 获取过滤的题目列表

**接口地址**: `POST /questions/list`

**接口描述**: 根据科目、难度和多个标签过滤获取题目列表，支持分页

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| subjectId | string | body | 否 | 科目 ID |
| difficulty | string/array | body | 否 | 难度等级，单个值或数组（支持多个）：easy、medium、hard |
| tags | array | body | 否 | 标签数组，支持多个标签 |
| page | number | body | 否 | 页码，默认 1 |
| limit | number | body | 否 | 每页数量，默认 20 |
| userId | string | body | 否 | 用户 ID，默认为 "guest"，用于过滤用户已删除的题目 |

**请求示例**:

```
# 获取指定科目的所有题目（不包含用户已删除的）
POST http://localhost:3000/questions/list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "userId": "user123",
  "page": 1,
  "limit": 10
}

# 按单个难度过滤
POST http://localhost:3000/questions/list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "difficulty": "medium",
  "userId": "user123",
  "page": 1,
  "limit": 20
}

# 按多个难度过滤
POST http://localhost:3000/questions/list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "difficulty": ["easy", "medium"],
  "userId": "user123",
  "page": 1,
  "limit": 20
}

# 按多个标签过滤
POST http://localhost:3000/questions/list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "tags": ["vue", "javascript", "lifecycle"],
  "userId": "user123",
  "page": 1,
  "limit": 15
}

# 组合过滤（多个难度 + 多个标签）
POST http://localhost:3000/questions/list
Content-Type: application/json

{
  "subjectId": "64f1a2b3c4d5e6f789012345",
  "difficulty": ["easy", "medium"],
  "tags": ["vue", "component"],
  "userId": "user123",
  "page": 2,
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
        "answer_analysis_markdown": "- beforeCreate：实例刚初始化...",
        "files": {
          "audio_simple": "q0001_285acd89_audio_simple.mp3",
          "audio_question": "q0001_285acd89_audio_question.mp3",
          "audio_analysis": "q0001_285acd89_audio_analysis.mp3",
          "meta": "q0001_285acd89_meta.json"
        },
        "subjectId": "64f1a2b3c4d5e6f789012345"
      }
      // ... 更多题目
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "subjectId": "64f1a2b3c4d5e6f789012345",
      "difficulty": "easy",
      "tags": ["vue", "lifecycle"]
    }
  },
  "message": "操作成功"
}
```

**分页字段说明**:

- `page`: 当前页码
- `limit`: 每页数量
- `total`: 总题目数
- `totalPages`: 总页数
- `hasNext`: 是否有下一页
- `hasPrev`: 是否有上一页

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
  "action": "practiced"
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

### 6.3 用户行为 (UserAction)

```
{
  "_id": "ObjectId",
  "userId": "用户ID",
  "questionId": "ObjectId",
  "action": "favorited|deleted",
  "createdAt": "Date"
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

# 获取用户统计
curl -X GET "http://localhost:3000/user-actions/stats?userId=user123"
```

---

## 9. 更新日志

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

### 1.8 根据科目 ID 获取困难程度统计

**接口地址**: `GET /subjects/:id/difficulty-levels`

**接口描述**: 根据科目 ID 获取该科目下所有题目的难度统计信息

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目的 ObjectId |

**请求示例**:

```bash
GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/difficulty-levels
```

**响应示例**:

``json
{
"success": true,
"data": [
{
"level": "简单",
"value": 10
},
{
"level": "中等",
"value": 10
},
{
"level": "困难",
"value": 5
}
],
"message": "操作成功"
}

```

**错误响应**:

``json
{
  "success": false,
  "data": null,
  "message": "科目不存在"
}
```

### 1.10 根据科目 ID 获取困难程度选项

**接口地址**: `GET /subjects/:id/difficulty-options`

**接口描述**: 根据科目 ID 获取该科目下所有题目的难度选项列表

**请求参数**:
| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| id | string | path | 是 | 科目的 ObjectId |

**请求示例**:

```bash
GET http://localhost:3000/subjects/64f1a2b3c4d5e6f789012345/difficulty-options
```

**响应示例**:

``json
{
"success": true,
"data": [
{
"name": "简单",
"value": "easy"
},
{
"name": "中等",
"value": "medium"
},
{
"name": "困难",
"value": "hard"
}
],
"message": "操作成功"
}

```

**错误响应**:

``json
{
  "success": false,
  "data": null,
  "message": "科目不存在"
}
```
