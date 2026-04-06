# 故事小站 (LittleStoryChat) - 变更日志

> 最后更新: 2026-04-06

---

## v1.0.0 (2026-04-06)

### commit xxx - feat(deploy): 增强SSL证书管理功能
- 添加独立 `./deploy.sh ssl` 命令申请证书
- 添加 `./deploy.sh ssl-status` 查看证书状态和有效期
- 添加 `./deploy.sh ssl-renew` 手动续期证书
- 显示证书详细信息 (到期日期、剩余天数)
- 自动设置 Let's Encrypt 续期定时器

### commit bb8296c - fix(deploy): 修复Docker构建错误
- 将 npm ci 改为 npm install (无需package-lock.json)
- 修复docker-compose中的容器名称
- 移除server对nginx的循环依赖

### commit b09bc39 - feat: 添加一键部署脚本
- 创建 deploy.sh 一键部署脚本
- 支持安装/更新/卸载/状态检查
- 自动检测并安装依赖 (Docker, Nginx, Node.js)
- 集成 SSL 证书配置
- 防火墙自动配置
- 项目文档完善 (PROJECT_PLAN/PROGRESS/CHANGELOG)

### commit ee42fa6 - feat: 项目更名为 LittleStoryChat，添加详细部署文档
- 界面标题改为"故事小站"
- 更新favicon设计
- 新增 DEPLOYMENT.md 详细部署指南
- 更新所有相关配置文件

### commit 4395d57 - feat: 完整的在线聊天室项目 (HiChat)
- 初始项目结构和Git配置
- 前端: Vue 3 + TypeScript + TailwindCSS + Pinia
- 后端: Node.js + Express + Socket.IO + SQLite
- 功能: 群聊、私信、接龙、通告、通知
- 部署: Docker Compose + Nginx

---

## 📝 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档变更
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具变更

### Scope 范围
- `ui`: 前端界面
- `api`: API接口
- `socket`: WebSocket
- `db`: 数据库
- `deploy`: 部署
- `auth`: 认证

---

## 规划中的版本

### v1.1.0
- 管理员后台
- 消息图片上传
- 用户头像上传

### v1.2.0
- 消息搜索
- @提及功能
- 消息撤回

### v2.0.0
- 深色/浅色主题
- PWA支持
- 移动端优化
