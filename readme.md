## mongoDB 安装

使用 Homebrew 安装 MongoDB

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
```

> 注意：@7.0 表示安装 MongoDB 7.0 版本。你可以根据需要指定其他版本（如 @6.0, @5.0），或不指定以安装最新稳定版。

## 启动 MongoDB

```bash
brew services start mongodb-community@7.0
# 如果你是用 Homebrew 安装的, 可以用下面的命令查看服务状态
brew services list | grep mongodb

```

停止服务：brew services stop mongodb-community@7.0
重启服务：brew services restart mongodb-community@7.0

## node 服务连接 mongodb

```javascript

// 在根目录创建.env 文件，并添加以下内容：
// 连接本地的 MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017
// 或者
MONGODB_URI=mongodb://localhost:27017

// 连接线上的 MongoDB
MONGODB_URI=mongodb://用户名:密码@线上服务器ip地址:27017/数据库名称
```

## 使用 pm2 启动 node 服务（可选）

如果不使用 pm2 可以直接使用 node server.js 启动服务

全局安装 pm2

```bash
npm install -g pm2
pm2 start server.js  --name "my-node-app" # 启动服务，并给进程取个易记的名字 --watch 模式非常适合开发环境，可以实现代码保存后自动重启。

# 停止服务
pm2 stop server.js
# 重启服务
pm2 restart server.js
# 删除应用（停止并从PM2列表中移除）
pm2 delete my-node-app
# 查看日志
pm2 logs my-node-app

# 查看进程列表
pm2 list
或者
pm2 status
```

# 刷题应用后端服务

## API 接口文档

### 题目相关接口

#### 随机获取题目

- **URL**: `/api/questions/random`
- **Method**: `GET`
- **Description**: 随机获取一道题目
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "题目ID",
      "subjectId": "科目ID",
      "type": "题目类型",
      "content": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "答案",
      "difficulty": "难度",
      "tags": ["标签1", "标签2"],
      "analysis": "解析",
      "isEnabled": true,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 根据条件筛选题目

- **URL**: `/api/questions/list`
- **Method**: `POST`
- **Description**: 根据条件筛选题目
- **Request Body**:
  ```json
  {
    "subjectId": "科目ID",
    "type": "题目类型",
    "difficulty": "难度",
    "tags": ["标签1", "标签2"],
    "count": 10
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "题目ID",
        "subjectId": "科目ID",
        "type": "题目类型",
        "content": "题目内容",
        "options": ["选项A", "选项B", "选项C", "选项D"],
        "answer": "答案",
        "difficulty": "难度",
        "tags": ["标签1", "标签2"],
        "analysis": "解析",
        "isEnabled": true,
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ]
  }
  ```

#### 随机获取指定数量的题目

- **URL**: `/api/questions/random-list`
- **Method**: `POST`
- **Description**: 随机获取指定数量的题目
- **Request Body**:
  ```json
  {
    "subjectId": "科目ID",
    "count": 10
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "题目ID",
        "subjectId": "科目ID",
        "type": "题目类型",
        "content": "题目内容",
        "options": ["选项A", "选项B", "选项C", "选项D"],
        "answer": "答案",
        "difficulty": "难度",
        "tags": ["标签1", "标签2"],
        "analysis": "解析",
        "isEnabled": true,
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ]
  }
  ```

#### 根据 ID 获取题目详情

- **URL**: `/api/questions/:id`
- **Method**: `GET`
- **Description**: 根据 ID 获取题目详情，支持 MongoDB 自动生成的 ObjectId 和自定义 id
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "题目ID",
      "subjectId": "科目ID",
      "type": "题目类型",
      "content": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "答案",
      "difficulty": "难度",
      "tags": ["标签1", "标签2"],
      "analysis": "解析",
      "isEnabled": true,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

### 科目相关接口

#### 获取所有科目

- **URL**: `/api/subjects`
- **Method**: `GET`
- **Description**: 获取所有科目
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "科目ID",
        "name": "科目名称",
        "code": "科目代码",
        "isEnabled": true,
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ]
  }
  ```

#### 获取科目详情

- **URL**: `/api/subjects/:id`
- **Method**: `GET`
- **Description**: 根据 ID 获取科目详情
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "科目ID",
      "name": "科目名称",
      "code": "科目代码",
      "isEnabled": true,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 获取所有科目及其题目统计信息

- **URL**: `/api/subjects/all`
- **Method**: `GET`
- **Description**: 获取所有科目及其题目统计信息，包括题目总数、各难度等级题目数量等
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "科目ID",
        "name": "科目名称",
        "code": "科目代码",
        "isEnabled": true,
        "questionCount": 100,
        "difficultyStats": [
          {
            "level": "简单",
            "count": 30
          },
          {
            "level": "中等",
            "count": 50
          },
          {
            "level": "困难",
            "count": 20
          }
        ],
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ]
  }
  ```

#### 根据科目 ID 获取标签

- **URL**: `/api/subjects/:id/tags-count`
- **Method**: `GET`
- **Description**: 根据科目 ID 获取该科目下所有题目的标签统计
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "name": "标签名称",
        "count": 10
      }
    ]
  }
  ```

#### 根据科目 ID 获取困难程度

- **URL**: `/api/subjects/:id/difficulty-levels`
- **Method**: `GET`
- **Description**: 根据科目 ID 获取该科目下所有题目的困难程度统计
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "level": "简单",
        "count": 30
      },
      {
        "level": "中等",
        "count": 50
      },
      {
        "level": "困难",
        "count": 20
      }
    ]
  }
  ```

#### 添加用户自定义标签

- **URL**: `/api/subjects/:id/user-tags`
- **Method**: `POST`
- **Description**: 为指定科目添加用户自定义标签
- **Request Body**:
  ```json
  {
    "name": "标签名称",
    "type": "标签类型" // 可选，默认为 "custom"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "标签添加成功"
  }
  ```

#### 修改用户自定义标签

- **URL**: `/api/subjects/:id/user-tags/:tagName`
- **Method**: `PUT`
- **Description**: 修改指定科目的用户自定义标签
- **Request Body**:
  ```json
  {
    "newName": "新标签名称",
    "type": "标签类型" // 可选，默认为 "custom"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "标签修改成功"
  }
  ```

#### 删除用户自定义标签

- **URL**: `/api/subjects/:id/user-tags/:tagName`
- **Method**: `DELETE`
- **Description**: 删除指定科目的用户自定义标签
- **Response**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "标签删除成功"
  }
  ```
