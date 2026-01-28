# 苏顺植保后端系统 - 快速启动指南

5分钟快速启动苏顺植保后端API系统！

## 🚀 快速开始（5分钟）

### 步骤1: 安装依赖

```bash
cd backend
npm install
```

### 步骤2: 配置数据库

确保MySQL已安装并运行，然后修改 `.env` 文件:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=sushun_db
```

### 步骤3: 初始化数据库

```bash
npm run init-db
npm run seed-data
```

### 步骤4: 启动服务器

```bash
npm run dev
```

完成！访问 http://localhost:3000

## 📋 详细步骤

### 1. 环境检查

确保已安装以下软件:

```bash
# 检查Node.js（需要16+）
node -v
# 输出示例: v18.17.0

# 检查npm
npm -v
# 输出示例: 9.6.7

# 检查MySQL（需要8.0+）
mysql --version
# 输出示例: mysql  Ver 8.0.36 for Linux on x86_64
```

### 2. 安装Node.js（如果未安装）

#### Windows

下载并安装: https://nodejs.org/

#### macOS

```bash
brew install node
```

#### Ubuntu/Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. 安装MySQL（如果未安装）

#### Windows

下载并安装: https://dev.mysql.com/downloads/installer/

#### macOS

```bash
brew install mysql
brew services start mysql
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

### 4. 创建数据库

```bash
# 登录MySQL
mysql -u root -p

# 在MySQL命令行中执行:
CREATE DATABASE sushun_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 5. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
nano .env  # Windows使用notepad .env
```

修改以下配置:

```env
# 数据库密码（必填）
DB_PASSWORD=你的MySQL密码

# JWT密钥（可选，生产环境必须修改）
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
```

### 6. 安装项目依赖

```bash
cd backend
npm install
```

等待安装完成，大约需要1-2分钟。

### 7. 初始化数据库

```bash
# 创建数据库表
npm run init-db
# 输出: ✅ 用户表创建成功
#      ✅ 客户表创建成功
#      ...

# 插入初始数据
npm run seed-data
# 输出: ✅ 管理员用户创建成功
#      ✅ 经理用户创建成功
#      ...
```

### 8. 启动开发服务器

```bash
# 开发模式（推荐）
npm run dev

# 或生产模式
npm start
```

看到以下输出表示启动成功:

```
✅ 数据库连接成功

=================================
🚀 苏顺植保API服务器已启动
📡 监听端口: 3000
🌍 访问地址: http://localhost:3000
🏭 环境: development
=================================

📋 API端点:
• GET / - 服务器状态
• GET /api/health - 健康检查
• POST /api/auth/login - 用户登录
• POST /api/auth/register - 用户注册
• GET /api/customers - 获取客户列表
• GET /api/messages - 获取留言列表
=================================
```

### 9. 测试API

打开新的终端窗口，执行以下命令:

```bash
# 测试健康检查
curl http://localhost:3000/api/health
# 输出: {"success":true,"status":"healthy","timestamp":"2026-01-28T..."}

# 测试用户登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 输出应该包含token和用户信息
```

## 🔐 默认账号

系统初始化后会创建以下测试账号:

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 所有功能 |
| manager | admin123 | 经理 | 大部分功能 |
| staff | admin123 | 客服 | 客户和留言管理 |

**⚠️ 重要**: 生产环境请立即修改默认密码！

## 🧪 测试API

### 使用curl测试

#### 1. 用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

保存返回的 `token`，后续请求需要使用。

#### 2. 获取客户列表

```bash
curl -X GET http://localhost:3000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 3. 获取留言列表

```bash
curl -X GET http://localhost:3000/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. 创建客户

```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "测试客户",
    "phone": "13900139000",
    "email": "test@example.com",
    "company": "测试公司",
    "address": "测试地址"
  }'
```

### 使用Postman测试

1. 下载Postman: https://www.postman.com/
2. 导入以下请求:

#### 登录请求
- **方法**: POST
- **URL**: `http://localhost:3000/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### 获取客户列表
- **方法**: GET
- **URL**: `http://localhost:3000/api/customers`
- **Headers**: `Authorization: Bearer <你的token>`

### 使用在线工具测试

访问 https://www.postman.com/ 或 https://hoppscotch.io/ 进行在线测试。

## 🎯 常见任务

### 查看日志

```bash
# 查看所有日志
npm run dev

# 查看错误日志
pm2 logs sushun-api --err
```

### 重启服务器

```bash
# 开发模式下自动重启
# 按 Ctrl+C 停止，然后重新运行
npm run dev
```

### 重置数据库

```bash
# 清除所有数据并重新初始化
npm run init-db
npm run seed-data
```

### 修改端口

编辑 `.env` 文件:

```env
PORT=8080
```

然后重启服务器。

## ❓ 常见问题

### Q1: npm install 失败

**问题**: 依赖安装失败

**解决**:
```bash
# 清除缓存
npm cache clean --force

# 使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 或使用yarn
npm install -g yarn
yarn install
```

### Q2: 数据库连接失败

**问题**: `Error: connect ECONNREFUSED`

**解决**:
```bash
# 检查MySQL是否运行
# Windows: 在服务中查看MySQL服务
# macOS: brew services list
# Linux: sudo systemctl status mysql

# 检查数据库配置
cat .env

# 测试数据库连接
mysql -u root -p

# 检查端口占用
netstat -ano | findstr :3306  # Windows
lsof -i :3306                 # macOS/Linux
```

### Q3: 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F

# macOS/Linux
lsof -i :3000
kill -9 <进程ID>

# 或修改端口
编辑 .env 文件，将 PORT=3000 改为其他端口
```

### Q4: 登录失败

**问题**: 返回 `用户名或密码错误`

**解决**:
```bash
# 确认已执行数据填充
npm run seed-data

# 检查默认账号
用户名: admin
密码: admin123

# 重置密码
mysql -u root -p
USE sushun_db;
UPDATE users SET password = (SELECT password FROM users WHERE username = 'admin') WHERE username = 'admin';
```

### Q5: 权限不足

**问题**: 返回 `权限不足`

**解决**:
```bash
# 检查用户角色
mysql -u root -p
USE sushun_db;
SELECT username, role FROM users;

# 确保使用的是管理员账号
用户名: admin (角色: admin)
用户名: manager (角色: manager)
用户名: staff (角色: staff)
```

### Q6: token过期

**问题**: 返回 `访问令牌已过期`

**解决**:
```bash
# 使用刷新令牌
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "你的刷新令牌"}'

# 或重新登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📚 下一步

### 1. 阅读完整文档

- [README.md](README.md) - 完整的项目文档
- [DEPLOYMENT.md](DEPLOYMENT.md) - 生产环境部署指南
- [API文档](README.md#api文档) - 详细的API接口说明

### 2. 开发新功能

```bash
# 创建新的控制器
nano controllers/productController.js

# 创建新的路由
nano routes/products.js

# 在server.js中注册路由
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);
```

### 3. 部署到生产环境

参考 [DEPLOYMENT.md](DEPLOYMENT.md) 进行生产环境部署。

### 4. 集成前端

前端API集成已在 `js/api.js` 中实现:

```javascript
import api from './js/api.js';

// 登录
const response = await api.login({
  username: 'admin',
  password: 'admin123'
});

// 获取客户列表
const customers = await api.getCustomers({
  page: 1,
  limit: 10
});
```

## 🎉 恭喜！

你已经成功启动了苏顺植保后端系统！

现在你可以:

- ✅ 使用API进行开发
- ✅ 集成到前端应用
- ✅ 部署到生产环境
- ✅ 开发新功能

## 📞 获取帮助

遇到问题？联系我们:

- 📧 邮箱: support@sushunzhibao.com
- 📞 电话: 400-888-8888
- 💬 在线支持: http://www.sushunzhibao.com

## 📖 相关资源

- [Express.js文档](https://expressjs.com/)
- [MySQL文档](https://dev.mysql.com/doc/)
- [JWT文档](https://jwt.io/)
- [PM2文档](https://pm2.keymetrics.io/)

---

**祝开发顺利！** 🚀

*苏顺植保技术团队*
