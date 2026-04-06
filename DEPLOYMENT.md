# 故事小站 (LittleStoryChat) - 部署指南

本文档提供在 VPS 上部署 LittleStoryChat 的详细步骤。

---

## 📋 目录

1. [服务器要求](#服务器要求)
2. [快速部署 (推荐)](#快速部署-推荐)
3. [手动部署](#手动部署)
4. [Nginx 配置](#nginx-配置)
5. [SSL 证书配置](#ssl-证书配置)
6. [Docker 部署](#docker-部署)
7. [故障排除](#故障排除)
8. [维护命令](#维护命令)

---

## 服务器要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Ubuntu 20.04+ / Debian 11+ |
| CPU | 1 核+ |
| 内存 | 512MB+ |
| 磁盘 | 5GB+ |
| 域名 | 已解析到服务器 IP |

---

## 快速部署 (推荐)

### 步骤 1: SSH 连接服务器

```bash
ssh root@45.62.123.22 -p 22
```

### 步骤 2: 安装必要软件

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com | sh
apt install docker-compose -y

# 启动 Docker
systemctl start docker
systemctl enable docker
```

### 步骤 3: 克隆项目

```bash
cd /var/www
git clone git@github.com:ttmanthatman/LittleStoryChat.git
cd LittleStoryChat
```

### 步骤 4: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置 (必须修改 JWT_SECRET)
nano .env
```

修改以下内容：
```env
JWT_SECRET=这里填入一个随机的安全字符串
CORS_ORIGIN=https://2.xiaogushi.us
```

生成安全密钥：
```bash
openssl rand -base64 32
```

### 步骤 5: 构建并启动

```bash
# 构建前端
cd client
npm install
npm run build
cd ..

# 启动服务 (后台运行)
docker-compose up -d
```

### 步骤 6: 验证部署

```bash
# 检查容器状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

访问 `https://2.xiaogushi.us` 检查是否正常运行。

---

## 手动部署

如果不使用 Docker，可以手动部署：

### 步骤 1: 安装 Node.js 20

```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# 验证安装
node -v  # 应该显示 v20.x.x
npm -v
```

### 步骤 2: 安装 PM2 (进程管理器)

```bash
npm install -g pm2
```

### 步骤 3: 安装 Nginx

```bash
apt install nginx -y
```

### 步骤 4: 配置后端

```bash
cd /var/www/LittleStoryChat/server
npm install
```

### 步骤 5: 创建环境变量文件

```bash
nano .env
```

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=你的安全密钥
CORS_ORIGIN=https://2.xiaogushi.us
DB_PATH=./data/hichat.db
```

### 步骤 6: 启动后端服务

```bash
pm2 start npm --name "littlestorychat" -- start
pm2 save
pm2 startup
```

### 步骤 7: 构建前端

```bash
cd /var/www/LittleStoryChat/client
npm install
npm run build
```

### 步骤 8: 配置 Nginx

```bash
nano /etc/nginx/sites-available/littlestorychat
```

写入以下配置：

```nginx
server {
    listen 80;
    server_name 2.xiaogushi.us;

    root /var/www/LittleStoryChat/client/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket 代理
    location /socket.io {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

启用站点：

```bash
ln -s /etc/nginx/sites-available/littlestorychat /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # 删除默认站点
nginx -t  # 测试配置
systemctl reload nginx
```

---

## Nginx 配置

如果已有 Nginx 配置，只需添加以下部分：

```nginx
# 在现有的 server 块中添加

# API 反向代理
location /api {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# WebSocket 代理
location /socket.io {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## SSL 证书配置

### 使用 Let's Encrypt (免费)

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 获取证书
certbot --nginx -d 2.xiaogushi.us

# 自动续期测试
certbot renew --dry-run
```

### 手动配置 (如果已有证书)

```nginx
server {
    listen 443 ssl http2;
    server_name 2.xiaogushi.us;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # ... 其他配置 ...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name 2.xiaogushi.us;
    return 301 https://$server_name$request_uri;
}
```

---

## Docker 部署

### docker-compose.yml 说明

```yaml
services:
  server:      # 后端服务 (Node.js)
  nginx:       # 前端服务 + 反向代理

volumes:
  server-data:   # 持久化数据库
  nginx-logs:     # Nginx 日志
```

### 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 重新构建
docker-compose up -d --build

# 删除所有数据 (谨慎使用)
docker-compose down -v
```

---

## 故障排除

### 1. 页面显示空白

检查前端构建是否成功：
```bash
ls -la client/dist/
```

### 2. 无法连接 WebSocket

检查 Nginx WebSocket 配置是否正确：
```bash
nginx -t
systemctl reload nginx
```

### 3. 数据库错误

检查数据库目录权限：
```bash
mkdir -p server/data
chmod 777 server/data
```

### 4. 端口被占用

```bash
# 查看端口占用
lsof -i :3001
lsof -i :80

# 杀死占用进程
kill -9 <PID>
```

### 5. 查看详细日志

```bash
# Docker 日志
docker-compose logs server

# PM2 日志 (手动部署)
pm2 logs littlestorychat
```

---

## 维护命令

### 备份数据库

```bash
# Docker 部署
docker cp littlestorychat-server:/app/data/hichat.db ./backup.db

# 手动部署
cp /var/www/LittleStoryChat/server/data/hichat.db ./backup_$(date +%Y%m%d).db
```

### 恢复数据库

```bash
# Docker 部署
docker cp backup.db littlestorychat-server:/app/data/hichat.db

# 手动部署
cp backup.db /var/www/LittleStoryChat/server/data/hichat.db
```

### 更新代码

```bash
cd /var/www/LittleStoryChat
git pull origin main

# Docker 部署
docker-compose up -d --build

# 手动部署
cd server && npm install && pm2 restart littlestorychat
cd ../client && npm install && npm run build
```

### 监控资源使用

```bash
# Docker 部署
docker stats

# 系统资源
htop
df -h
free -m
```

---

## 安全建议

1. **修改 JWT_SECRET** - 使用强随机密钥
2. **配置防火墙** - 只开放 80/443 端口
3. **定期更新** - 保持系统和软件最新
4. **备份数据** - 定期备份数据库
5. **使用 HTTPS** - 启用 SSL 证书

### 防火墙配置 (UFW)

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

---

## 技术支持

如有问题，请检查：
1. 服务器日志
2. Nginx 错误日志: `/var/log/nginx/error.log`
3. Docker 日志: `docker-compose logs`

---

*本文档最后更新: 2024年*
