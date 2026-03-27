# 农用杀螨剂信息平台

## 项目简介

这是一个农用杀螨剂信息平台，旨在为农户、农资经销商和科研人员提供杀螨剂相关的信息和数据分析。

## 项目结构

```
acaricide-platform/
├── backend/              # 后端代码
│   ├── api/              # API路由
│   ├── crawler/          # 数据爬虫
│   ├── models/           # 数据模型
│   ├── utils/            # 工具函数
│   ├── app.py            # Flask应用入口
│   ├── requirements.txt  # 依赖包
│   └── .env              # 环境变量
├── frontend/             # 前端代码
│   ├── public/           # 静态资源
│   ├── src/              # 源代码
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   ├── utils/        # 工具函数
│   │   ├── App.js        # 应用主组件
│   │   └── index.js      # 入口文件
│   └── package.json      # 前端依赖
└── README.md             # 项目说明
```

## 技术栈

- **后端**：Flask、MongoDB、Scrapy
- **前端**：React、Ant Design、ECharts
- **认证**：JWT

## 功能特性

### V1: 最小可行产品 (MVP)
1. **核心数据抓取**：抓取国内主要农药登记网站的杀螨剂基础信息
2. **基础搜索功能**：按作物类型、螨虫种类、有效成分搜索杀螨剂
3. **产品详情页**：展示杀螨剂的详细信息和基础对比功能
4. **用户权限管理**：区分农户、经销商、科研人员三种角色
5. **数据可视化**：简单的市场分布图表和基础的产品使用统计

### V2 及以后版本
1. **高级数据抓取**：扩展到国际数据库和学术文献
2. **智能推荐系统**：基于用户种植作物和螨虫类型的个性化推荐
3. **市场分析工具**：深度的市场趋势分析和竞争对手分析
4. **科研支持功能**：数据导出和API接口
5. **社区互动**：用户评价和使用经验分享

## 快速开始

### 后端设置

1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

2. 初始化数据库
```bash
python utils/init_db.py
```

3. 启动后端服务
```bash
python app.py
```

### 前端设置

1. 安装依赖
```bash
cd frontend
npm install
```

2. 启动前端服务
```bash
npm start
```

## API文档

### 产品相关
- `GET /api/products` - 获取产品列表
- `POST /api/products/search` - 搜索产品
- `GET /api/products/<product_id>` - 获取产品详情

### 用户相关
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录

### 统计相关
- `GET /api/stats` - 获取统计数据

## 注意事项

1. 确保MongoDB服务已启动
2. 后端服务默认运行在 http://localhost:5000
3. 前端服务默认运行在 http://localhost:3000
4. 实际部署时，需要修改环境变量中的SECRET_KEY

## 贡献

欢迎贡献代码和提出建议！

## 许可证

MIT License