# 苏顺植保后端API系统

基于Node.js + Express + MySQL的RESTful API后端系统，为苏顺植保网站提供完整的数据管理和业务逻辑支持。

## 📋 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [API文档](#api文档)
- [数据库设计](#数据库设计)
- [部署说明](#部署说明)
- [开发指南](#开发指南)

## 功能特性

### ✅ 已实现功能

- **用户认证与授权**
  - JWT令牌认证
  - 用户注册、登录、登出
  - 角色权限管理（管理员、经理、客服、销售）
  - 令牌刷新机制
  - 登录失败次数限制和账号锁定

- **客户管理**
  - 客户信息增删改查
  - 客户搜索和筛选
  - 分页查询
  - 客户状态管理
  - 销售人员分配

- **留言管理**
  - 留言列表查询
  - 留言详情查看
  - 留言回复功能
  - 状态更新（待处理、处理中、已回复、已关闭）
  - 留言统计
  - 优先级管理

- **数据验证与安全**
  - 请求数据验证
  - 错误处理中间件
  - CORS跨域支持
  - 速率限制
  - SQL注入防护
  - XSS攻击防护

### 🚧 待开发功能

- 产品管理API
- 订单管理API
- 操作日志记录
- 文件上传功能
- 邮件通知系统
- 数据导出功能

## 技术栈

### 后端技术

- **运行环境**: Node.js 16+
- **Web框架**: Express.js 4.18+
- **数据库**: MySQL 8.0+
- **ORM**: mysql2 (Promise API)
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs
- **数据验证**: Joi
- **安全**: Helmet, CORS, Rate Limit

### 开发工具

- **开发服务器**: Nodemon
- **测试框架**: Jest
- **HTTP客户端**: Supertest

## 项目结构

```
backend/
├── config/              # 配置文件
│   └── database.js      # 数据库配置
├── controllers/         # 控制器
│   ├── authController.js      # 认证控制器
│   ├── customerController.js  # 客户控制器
│   └── messageController.js   # 留言控制器
├── middleware/          # 中间件
│   ├── auth.js          # 认证中间件
│   └── errorHandler.js  # 错误处理中间件
├── routes/              # 路由
│   ├── auth.js          # 认证路由
│   ├── customers.js     # 客户路由
│   └── messages.js      # 留言路由
├── scripts/             # 脚本文件
│   ├── init-database.js # 数据库初始化
│   └── seed-data.js     # 数据填充
├── .env                 # 环境变量
├── .env.example         # 环境变量示例
├── package.json         # 项目配置
├── server.js            # 服务器入口
└── README.md            # 项目文档
```

## 快速开始

### 前置要求

- Node.js 16+ 和 npm
- MySQL 8.0+
- Git

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sushun_db

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=30d

# CORS配置
CORS_ORIGIN=http://localhost:8000
```

### 3. 初始化数据库

```bash
# 创建数据库表
npm run init-db

# 插入初始数据
npm run seed-data
```

### 4. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器启动后访问：http://localhost:3000

## API文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

### 响应格式

#### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 返回的数据
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "code": "错误代码"
}
```

### 认证接口

#### 1. 用户登录

**请求**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@sushunzhibao.com",
      "fullName": "系统管理员",
      "phone": "400-888-8888",
      "role": "admin",
      "status": "active"
    }
  }
}
```

#### 2. 用户注册

**请求**:
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "newuser@example.com",
  "fullName": "新用户",
  "phone": "13800138000",
  "role": "staff"
}
```

#### 3. 获取用户信息

**请求**:
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### 4. 更新用户信息

**请求**:
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "fullName": "新名称",
  "phone": "13900139000"
}
```

#### 5. 刷新令牌

**请求**:
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 客户管理接口

#### 1. 获取客户列表

**请求**:
```http
GET /api/customers?page=1&limit=10&search=张三&status=active
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `search`: 搜索关键词（姓名、电话、邮箱、公司）
- `status`: 客户状态（potential, active, inactive）
- `sortBy`: 排序字段（默认created_at）
- `order`: 排序方式（ASC, DESC，默认DESC）

**响应**:
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "name": "张三",
        "phone": "13800138000",
        "email": "zhangsan@example.com",
        "company": "张三农业有限公司",
        "address": "北京市朝阳区建国路123号",
        "customer_source": "网站",
        "status": "active",
        "sales_person_id": 1,
        "notes": "VIP客户，订单量大",
        "created_at": "2026-01-28T10:00:00.000Z",
        "updated_at": "2026-01-28T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### 2. 获取客户详情

**请求**:
```http
GET /api/customers/:id
Authorization: Bearer <token>
```

#### 3. 创建客户

**请求**:
```http
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "phone": "13900139000",
  "email": "lisi@example.com",
  "company": "李四农场",
  "address": "上海市浦东新区世纪大道456号",
  "customerSource": "电话",
  "status": "potential",
  "salesPersonId": 1,
  "notes": "潜在客户"
}
```

#### 4. 更新客户

**请求**:
```http
PUT /api/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "李四",
  "phone": "13900139000",
  "email": "lisi@example.com",
  "status": "active"
}
```

#### 5. 删除客户

**请求**:
```http
DELETE /api/customers/:id
Authorization: Bearer <token>
```

### 留言管理接口

#### 1. 获取留言列表

**请求**:
```http
GET /api/messages?page=1&limit=10&status=pending&priority=high
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `search`: 搜索关键词
- `status`: 留言状态（pending, processing, replied, closed）
- `priority`: 优先级（low, medium, high）
- `sortBy`: 排序字段
- `order`: 排序方式

**响应**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "customer_id": 1,
        "customer_name": "张三",
        "name": "张三",
        "phone": "13800138000",
        "email": "zhangsan@example.com",
        "subject": "产品咨询",
        "content": "我想咨询一下你们的产品...",
        "priority": "medium",
        "status": "pending",
        "reply_content": null,
        "replied_by": null,
        "replied_at": null,
        "closed_by": null,
        "closed_at": null,
        "close_reason": null,
        "created_at": "2026-01-28T10:00:00.000Z",
        "updated_at": "2026-01-28T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "pages": 2
    }
  }
}
```

#### 2. 获取留言详情

**请求**:
```http
GET /api/messages/:id
Authorization: Bearer <token>
```

#### 3. 创建留言

**请求**:
```http
POST /api/messages
Content-Type: application/json

{
  "customerId": 1,
  "name": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "subject": "产品咨询",
  "content": "我想咨询一下你们的产品...",
  "priority": "medium"
}
```

#### 4. 回复留言

**请求**:
```http
PUT /api/messages/:id/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "replyContent": "您好，感谢您的咨询..."
}
```

#### 5. 更新留言状态

**请求**:
```http
PUT /api/messages/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "closed",
  "closeReason": "问题已解决"
}
```

#### 6. 删除留言

**请求**:
```http
DELETE /api/messages/:id
Authorization: Bearer <token>
```

#### 7. 获取留言统计

**请求**:
```http
GET /api/messages/stats
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "status": [
      { "status": "pending", "count": 5 },
      { "status": "processing", "count": 3 },
      { "status": "replied", "count": 8 },
      { "status": "closed", "count": 4 }
    ],
    "priority": [
      { "priority": "low", "count": 3 },
      { "priority": "medium", "count": 12 },
      { "priority": "high", "count": 5 }
    ],
    "today": 2
  }
}
```

## 数据库设计

### 数据表结构

#### users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| username | VARCHAR(50) | 用户名，唯一 |
| password | VARCHAR(255) | 密码（加密） |
| email | VARCHAR(100) | 邮箱，唯一 |
| full_name | VARCHAR(100) | 姓名 |
| phone | VARCHAR(20) | 电话 |
| role | ENUM | 角色（admin, manager, staff, sales） |
| status | ENUM | 状态（active, inactive, locked） |
| last_login | TIMESTAMP | 最后登录时间 |
| failed_login_attempts | INT | 登录失败次数 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### customers（客户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(100) | 客户姓名 |
| phone | VARCHAR(20) | 电话 |
| email | VARCHAR(100) | 邮箱 |
| company | VARCHAR(100) | 公司名称 |
| address | TEXT | 地址 |
| customer_source | VARCHAR(50) | 客户来源 |
| status | ENUM | 状态（potential, active, inactive） |
| sales_person_id | INT | 销售人员ID |
| notes | TEXT | 备注 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### messages（留言表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| customer_id | INT | 客户ID（外键） |
| name | VARCHAR(100) | 留言人姓名 |
| phone | VARCHAR(20) | 电话 |
| email | VARCHAR(100) | 邮箱 |
| subject | VARCHAR(200) | 主题 |
| content | TEXT | 内容 |
| priority | ENUM | 优先级（low, medium, high） |
| status | ENUM | 状态（pending, processing, replied, closed） |
| reply_content | TEXT | 回复内容 |
| replied_by | INT | 回复人ID（外键） |
| replied_at | TIMESTAMP | 回复时间 |
| closed_by | INT | 关闭人ID（外键） |
| closed_at | TIMESTAMP | 关闭时间 |
| close_reason | VARCHAR(200) | 关闭原因 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### products（产品表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(200) | 产品名称 |
| category | VARCHAR(50) | 分类 |
| brand | VARCHAR(100) | 品牌 |
| price | DECIMAL(10,2) | 价格 |
| original_price | DECIMAL(10,2) | 原价 |
| stock | INT | 库存 |
| unit | VARCHAR(20) | 单位 |
| specifications | TEXT | 规格参数 |
| description | TEXT | 描述 |
| usage_instructions | TEXT | 使用说明 |
| precautions | TEXT | 注意事项 |
| image_url | VARCHAR(500) | 图片URL |
| gallery_urls | JSON | 图片集 |
| status | ENUM | 状态（active, inactive, discontinued） |
| sort_order | INT | 排序 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### orders（订单表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| order_no | VARCHAR(50) | 订单号，唯一 |
| customer_id | INT | 客户ID（外键） |
| contact_name | VARCHAR(100) | 联系人 |
| contact_phone | VARCHAR(20) | 联系电话 |
| contact_email | VARCHAR(100) | 联系邮箱 |
| shipping_address | TEXT | 收货地址 |
| total_amount | DECIMAL(10,2) | 总金额 |
| payment_method | VARCHAR(50) | 支付方式 |
| payment_status | ENUM | 支付状态（unpaid, paid, refunded） |
| order_status | ENUM | 订单状态（pending, confirmed, shipped, completed, cancelled） |
| shipping_method | VARCHAR(50) | 配送方式 |
| tracking_number | VARCHAR(100) | 运单号 |
| remark | TEXT | 备注 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### order_items（订单明细表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| order_id | INT | 订单ID（外键） |
| product_id | INT | 产品ID（外键） |
| product_name | VARCHAR(200) | 产品名称 |
| product_specifications | TEXT | 产品规格 |
| quantity | INT | 数量 |
| unit_price | DECIMAL(10,2) | 单价 |
| total_price | DECIMAL(10,2) | 小计 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### operation_logs（操作日志表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| user_id | INT | 用户ID（外键） |
| action | VARCHAR(100) | 操作类型 |
| module | VARCHAR(50) | 模块 |
| description | TEXT | 描述 |
| ip_address | VARCHAR(45) | IP地址 |
| user_agent | TEXT | 用户代理 |
| created_at | TIMESTAMP | 创建时间 |

## 部署说明

### 环境要求

- Node.js 16+
- MySQL 8.0+
- 至少1GB内存
- 至少2GB磁盘空间

### 生产环境部署

#### 1. 克隆项目

```bash
git clone <repository-url>
cd backend
```

#### 2. 安装依赖

```bash
npm install --production
```

#### 3. 配置环境变量

```bash
# 创建生产环境配置文件
cp .env.example .env.production

# 编辑配置文件
nano .env.production
```

#### 4. 构建和启动

```bash
# 使用PM2管理进程
npm install -g pm2

# 启动应用
pm2 start server.js --name sushun-api

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs sushun-api
```

#### 5. Nginx反向代理

```nginx
server {
    listen 80;
    server_name api.sushunzhibao.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6. SSL证书配置

```bash
# 使用Let's Encrypt免费证书
certbot --nginx -d api.sushunzhibao.com
```

## 开发指南

### 代码规范

- 使用ES6+语法
- 遵循Airbnb JavaScript风格指南
- 使用async/await处理异步操作
- 错误处理使用try-catch
- 变量命名使用驼峰命名法
- 常量命名使用全大写加下划线

### 开发流程

1. 创建新分支
2. 开发功能
3. 编写测试
4. 提交代码
5. 发起Pull Request
6. 代码审查
7. 合并到主分支

### 调试技巧

```javascript
// 在代码中添加调试日志
console.log('调试信息:', data);

// 使用debugger语句
debugger;

// 查看请求详情
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});
```

### 常见问题

#### 1. 数据库连接失败

**问题**: `Error: connect ECONNREFUSED`

**解决**:
- 检查MySQL服务是否启动
- 检查数据库配置是否正确
- 检查防火墙设置

#### 2. 认证失败

**问题**: `401 Unauthorized`

**解决**:
- 检查token是否正确
- 检查token是否过期
- 检查Authorization头格式

#### 3. CORS错误

**问题**: `No 'Access-Control-Allow-Origin' header`

**解决**:
- 检查CORS配置
- 确认请求来源在允许列表中

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起Pull Request

## 许可证

MIT License

## 联系方式

- 邮箱：support@sushunzhibao.com
- 电话：400-888-8888
- 地址：北京市朝阳区xxx路xxx号

## 更新日志

### v1.0.0 (2026-01-28)

- ✅ 实现用户认证与授权
- ✅ 实现客户管理功能
- ✅ 实现留言管理功能
- ✅ 实现数据验证和错误处理
- ✅ 完成数据库设计
- ✅ 完成API文档编写

---

**开发团队**: 苏顺植保技术团队  
**最后更新**: 2026-01-28  
**文档版本**: v1.0.0
