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
