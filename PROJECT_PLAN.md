# 故事小站 (LittleStoryChat) - 项目架构

> 最后更新: 2026-04-06

---

## 一、项目概述

| 项目 | 信息 |
|------|------|
| **项目名称** | 故事小站 (LittleStoryChat) |
| **项目类型** | 实时在线聊天室 (全栈Web应用) |
| **核心功能** | 群聊、私信、通知、接龙游戏、置顶通告、消息回复 |
| **目标用户** | 社区交流、团队协作 |
| **部署域名** | https://2.xiaogushi.us |

---

## 二、技术栈

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | 3.4+ | 核心框架 (组合式API) |
| Vite | 5.x | 构建工具 |
| TypeScript | 5.x | 类型安全 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Socket.IO Client | 4.x | 实时通信 |
| TailwindCSS | 3.x | 样式框架 |
| Lucide Vue | 最新 | 图标库 |

### 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x LTS | 运行时 |
| Express | 4.x | Web框架 |
| Socket.IO | 4.x | WebSocket服务 |
| better-sqlite3 | 9.x | SQLite数据库 |
| jsonwebtoken | 9.x | JWT认证 |
| bcryptjs | 2.x | 密码加密 |

---

## 三、端口与配置约定

### 服务端口
| 服务 | 端口 | 说明 |
|------|------|------|
| Node.js 后端 | 3001 | API + WebSocket |
| Nginx | 80/443 | 反向代理 |
| 前端开发 | 5173 | Vite Dev Server |

### 环境变量
| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务器端口 |
| `NODE_ENV` | production | 运行环境 |
| `JWT_SECRET` | - | JWT密钥 (必填) |
| `CORS_ORIGIN` | https://2.xiaogushi.us | 允许的源 |
| `DB_PATH` | ./data/hichat.db | 数据库路径 |

### API 基础路径
- REST API: `/api/*`
- WebSocket: `/socket.io`
- 健康检查: `/health`

---

## 四、数据库设计

### 数据表结构
```
users              - 用户表
messages           - 群聊消息表
private_messages   - 私信表
word_chains       - 接龙表
chain_entries     - 接龙记录表
announcements     - 通告表
notifications     - 通知表
```

### 数据库位置
- 开发环境: `server/data/hichat.db`
- Docker: `/app/data/hichat.db` (持久化卷)

---

## 五、项目目录结构

```
LittleStoryChat/
├── client/                     # Vue 3 前端
│   ├── src/
│   │   ├── components/         # Vue组件
│   │   │   ├── ChatRoom.vue        # 聊天室
│   │   │   ├── MessageBubble.vue   # 消息气泡
│   │   │   ├── PrivateChat.vue     # 私信
│   │   │   ├── ChainRoom.vue       # 接龙
│   │   │   └── AnnouncementPanel.vue  # 通告
│   │   ├── views/              # 页面视图
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   └── ChatView.vue
│   │   ├── stores/             # Pinia状态
│   │   │   └── auth.ts
│   │   ├── composables/        # 组合式函数
│   │   │   ├── useApi.ts
│   │   │   └── useSocket.ts
│   │   └── router/
│   ├── public/
│   │   └── favicon.svg
│   └── package.json
├── server/                     # Node.js 后端
│   ├── src/
│   │   ├── routes/             # API路由
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── messages.js
│   │   │   ├── chains.js
│   │   │   └── announcements.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── socket/
│   │   │   └── handlers.js
│   │   ├── db/
│   │   │   └── init.js
│   │   └── index.js
│   └── package.json
├── nginx/                      # Nginx配置
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
├── docker-compose.yml
├── .env.example
├── README.md
├── DEPLOYMENT.md
├── PROGRESS.md
└── CHANGELOG.md
```

---

## 六、部署架构

```
用户浏览器 (HTTPS)
       ↓
    Nginx (443)
       ↓
   ┌───────┐
   │ Proxy │ ← /api → Node.js:3001
   │       │ ← /socket.io → Node.js:3001
   │       │ ← / → 静态文件
   └───────┘
       ↓
  Node.js Server
       ↓
   SQLite DB
```

---

## 七、安全约定

1. **密码**: 使用 bcryptjs 加密存储
2. **认证**: JWT Token (7天有效期)
3. **CORS**: 仅允许配置的域名
4. **WebSocket**: 需携带有效 JWT Token
5. **管理员**: 数据库 `is_admin` 字段控制

---

## 八、Git 工作流

- **远程仓库**: git@github.com:ttmanthatman/LittleStoryChat.git
- **分支策略**: main (主分支)
- **提交规范**: feat/fix/docs/chore

---

## 九、相关文档

| 文档 | 用途 |
|------|------|
| README.md | 项目说明|
| DEPLOYMENT.md | 详细部署指南 |
| PROGRESS.md | 开发进度跟踪 |
| CHANGELOG.md | 变更记录 |
