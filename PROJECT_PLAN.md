# 在线聊天室项目规划

## 一、项目概述

**项目名称**: 嗨聊 (HiChat)
**项目类型**: 实时在线聊天室 (全栈Web应用)
**核心功能**: 群聊、私信、通知、接龙游戏、置顶通告、消息回复
**目标用户**: 需要团队协作沟通、社区交流的用户群体

---

## 二、技术架构

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
| SQLite | - | 轻量级数据库 |
| JWT | - | 用户认证 |
| bcrypt | - | 密码加密 |
| CORS | - | 跨域支持 |

### 部署架构
```
用户浏览器 ←→ Nginx (反向代理) ←→ Node.js 服务 (端口3001)
                                            ↓
                                      SQLite 数据库
```

---

## 三、功能模块

### 3.1 用户系统
- [x] 用户注册 (用户名、密码)
- [x] 用户登录 (JWT Token)
- [x] 用户列表展示
- [x] 在线状态显示
- [x] 最后活跃时间

### 3.2 群聊功能
- [x] 公共聊天室消息
- [x] 消息实时推送
- [x] 消息时间戳
- [x] 消息分页加载
- [x] 新消息滚动到底部

### 3.3 私信功能
- [x] 用户间一对一聊天
- [x] 私信列表
- [x] 未读消息标记
- [x] 私信历史记录

### 3.4 通知系统
- [x] 系统通知推送
- [x] 通知类型 (上线、下线、公告)
- [x] 通知中心
- [x] 未读通知计数

### 3.5 接龙功能
- [x] 创建接龙活动
- [x] 参与接龙
- [x] 接龙链展示
- [x] 接龙统计
- [x] 接龙状态管理

### 3.6 置顶通告
- [x] 管理员发布通告
- [x] 通告置顶显示
- [x] 通告过期机制
- [x] 通告编辑/删除

### 3.7 回复功能
- [x] 对消息进行回复
- [x] 回复引用显示
- [x] 回复通知

---

## 四、数据库设计

### 用户表 (users)
```
id: INTEGER PRIMARY KEY
username: TEXT UNIQUE
password: TEXT (加密)
avatar: TEXT (可选)
created_at: DATETIME
last_seen: DATETIME
is_online: BOOLEAN
```

### 消息表 (messages)
```
id: INTEGER PRIMARY KEY
user_id: INTEGER (FK)
content: TEXT
type: TEXT (normal/reply/system)
reply_to: INTEGER (FK, 可选)
created_at: DATETIME
```

### 私信表 (private_messages)
```
id: INTEGER PRIMARY KEY
sender_id: INTEGER (FK)
receiver_id: INTEGER (FK)
content: TEXT
is_read: BOOLEAN
created_at: DATETIME
```

### 接龙表 (word_chains)
```
id: INTEGER PRIMARY KEY
creator_id: INTEGER (FK)
title: TEXT
current_word: TEXT
is_active: BOOLEAN
created_at: DATETIME
ended_at: DATETIME
```

### 接龙记录表 (chain_entries)
```
id: INTEGER PRIMARY KEY
chain_id: INTEGER (FK)
user_id: INTEGER (FK)
word: TEXT
created_at: DATETIME
```

### 通告表 (announcements)
```
id: INTEGER PRIMARY KEY
content: TEXT
priority: INTEGER
is_active: BOOLEAN
expires_at: DATETIME
created_by: INTEGER (FK)
created_at: DATETIME
```

---

## 五、API 接口设计

### REST API
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/users | 获取用户列表 |
| GET | /api/users/:id | 获取用户信息 |
| GET | /api/messages | 获取历史消息 |
| GET | /api/private/:userId | 获取私信记录 |
| GET | /api/chains | 获取接龙列表 |
| POST | /api/chains | 创建接龙 |
| GET | /api/announcements | 获取通告 |

### WebSocket 事件
| 事件名 | 方向 | 功能 |
|--------|------|------|
| join | Client→Server | 用户加入 |
| leave | Client→Server | 用户离开 |
| message | Client↔Server | 发送消息 |
| private | Client↔Server | 发送私信 |
| typing | Client↔Server | 正在输入 |
| notification | Server→Client | 推送通知 |
| online_users | Server→Client | 在线用户列表 |
| chain_update | Server→Client | 接龙更新 |
| announcement | Server→Client | 通告更新 |

---

## 六、界面设计

### 页面结构
1. **登录/注册页** - 用户认证入口
2. **主聊天室** - 包含：
   - 左侧：用户列表 + 接龙列表
   - 中间：消息区域 + 通告栏
   - 右侧：快捷操作 + 通知中心

### 配色方案
- 主色: `#6366f1` (Indigo)
- 次色: `#8b5cf6` (Purple)
- 背景: `#0f172a` (深蓝灰)
- 文字: `#e2e8f0` (浅灰白)
- 强调: `#22d3ee` (青色)

### 响应式设计
- 桌面端: 三栏布局
- 平板: 两栏布局 (侧边栏可折叠)
- 移动端: 单栏 + 底部导航

---

## 七、部署方案

### 部署流程
1. 本地开发测试
2. 构建生产版本
3. 通过SSH上传到VPS
4. 配置Nginx反向代理
5. 配置Systemd服务
6. 启动并验证

### VPS配置
- 域名: `2.xiaogushi.us`
- 端口: 3001 (Node.js服务)
- Nginx: 80/443端口监听

### 目录结构
```
/var/www/hichat/
├── server/          # 后端代码
│   ├── index.js
│   ├── package.json
│   └── data/        # SQLite数据库
├── dist/            # 前端构建文件
└── .env             # 环境配置
```

---

## 八、开发时间估算

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| Phase 1 | 项目初始化 + 后端基础 | 30分钟 |
| Phase 2 | 用户认证系统 | 30分钟 |
| Phase 3 | 群聊功能 | 45分钟 |
| Phase 4 | 私信功能 | 30分钟 |
| Phase 5 | 接龙功能 | 45分钟 |
| Phase 6 | 通告 + 通知 | 30分钟 |
| Phase 7 | 前端美化 + 响应式 | 30分钟 |
| Phase 8 | 部署 + 调试 | 30分钟 |
| **总计** | | **约4小时** |

---

## 九、风险与注意事项

1. **不影响现有服务**: 仅使用3001端口，不修改Nginx其他配置
2. **数据安全**: 密码加密存储
3. **性能优化**: 消息分页、连接复用
4. **错误处理**: 完善的异常捕获

---

## 十、下一步行动

请确认此规划，我将开始实施开发：
1. 初始化项目结构
2. 开发后端服务
3. 开发前端应用
4. 部署到VPS
