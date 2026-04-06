# 故事小站 (LittleStoryChat) - 在线聊天室

一个现代化的实时在线聊天室，支持群聊、私信、接龙游戏、通告通知等功能。

## 功能特性

- 🔐 **用户系统** - 注册/登录/JWT认证
- 💬 **群聊** - 实时消息推送、消息回复
- ✉️ **私信** - 用户间一对一聊天
- 🎮 **接龙** - 词语接龙游戏
- 📢 **通告** - 管理员发布置顶公告
- 🔔 **通知** - 实时系统通知

## 技术栈

### 前端
- Vue 3 (Composition API)
- TypeScript
- Vite
- TailwindCSS
- Pinia (状态管理)
- Socket.IO Client

### 后端
- Node.js 20+
- Express
- Socket.IO
- SQLite (better-sqlite3)
- JWT 认证

## 快速开始

### 前置要求
- Node.js 20+
- Docker & Docker Compose (用于部署)

### 本地开发

1. 安装依赖
```bash
cd server && npm install
cd ../client && npm install
```

2. 启动后端
```bash
cd server
npm run dev
```

3. 启动前端
```bash
cd client
npm run dev
```

4. 访问 http://localhost:5173

## 部署

### 使用 Docker Compose

1. 复制环境变量文件
```bash
cp .env.example .env
# 编辑 .env 设置 JWT_SECRET
```

2. 启动服务
```bash
docker-compose up -d
```

3. 访问 http://your-domain.com

### VPS 手动部署

1. 安装 Node.js 20+
2. 安装 Nginx
3. 配置反向代理
4. 使用 PM2 或 Systemd 管理进程

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| PORT | 服务器端口 | 否 (默认3001) |
| JWT_SECRET | JWT密钥 | 是 |
| CORS_ORIGIN | 允许的源 | 否 |
| DB_PATH | 数据库路径 | 否 |

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 用户
- `GET /api/users` - 获取用户列表
- `GET /api/users/me/profile` - 获取当前用户

### 消息
- `GET /api/messages` - 获取群聊历史
- `GET /api/messages/private/:userId` - 获取私信记录

### 接龙
- `GET /api/chains` - 获取接龙列表
- `POST /api/chains` - 创建接龙
- `POST /api/chains/:id/join` - 参与接龙

### 通告
- `GET /api/announcements` - 获取通告
- `POST /api/announcements` - 发布通告 (管理员)

## 目录结构

```
LittleStoryChat/
├── client/                 # 前端
│   ├── src/
│   │   ├── components/     # Vue组件
│   │   ├── views/         # 页面视图
│   │   ├── stores/        # Pinia状态
│   │   └── composables/   # 组合式函数
│   └── package.json
├── server/                 # 后端
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── middleware/     # 中间件
│   │   ├── socket/        # Socket处理
│   │   └── db/           # 数据库
│   └── package.json
├── nginx/                  # Nginx配置
├── docker-compose.yml      # Docker编排
└── .env                    # 环境变量
```

## License

MIT
