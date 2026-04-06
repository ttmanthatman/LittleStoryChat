#!/bin/bash
#
# 故事小站 (LittleStoryChat) 一键部署脚本
# 
# 用法:
#   ./deploy.sh              # 交互式安装
#   ./deploy.sh install      # 安装
#   ./deploy.sh update       # 更新
#   ./deploy.sh uninstall    # 卸载
#   ./deploy.sh status       # 查看状态
#   ./deploy.sh logs         # 查看日志
#   ./deploy.sh restart      # 重启服务
#

set -e

# ==================== 配置 ====================
APP_NAME="littlestorychat"
APP_DIR="/var/www/LittleStoryChat"
DOMAIN="2.xiaogushi.us"
API_PORT=3001
NGINX_PORT=80

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==================== 函数库 ====================

# 输出带颜色的文字
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 打印标题
print_banner() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}     ${GREEN}故事小站 (LittleStoryChat) 部署脚本${NC}       ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "请使用 root 用户运行此脚本"
        echo "提示: sudo ./deploy.sh install"
        exit 1
    fi
}

# 检查 Docker 是否安装
check_docker() {
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version 2>/dev/null | awk '{print $3}' | tr -d ',')
        log_success "Docker 已安装: $DOCKER_VERSION"
        return 0
    else
        log_warn "Docker 未安装"
        return 1
    fi
}

# 检查 Docker Compose 是否安装
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version 2>/dev/null | awk '{print $3}' | tr -d ',')
        log_success "Docker Compose 已安装: $COMPOSE_VERSION"
        return 0
    else
        log_warn "Docker Compose 未安装"
        return 1
    fi
}

# 检查 Node.js 是否安装
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version 2>/dev/null)
        log_success "Node.js 已安装: $NODE_VERSION"
        return 0
    else
        log_warn "Node.js 未安装"
        return 1
    fi
}

# 检查 Nginx 是否安装
check_nginx() {
    if command -v nginx &> /dev/null; then
        NGINX_VERSION=$(nginx -v 2>&1 | awk '{print $3}' | tr -d '/')
        log_success "Nginx 已安装: $NGINX_VERSION"
        return 0
    else
        log_warn "Nginx 未安装"
        return 1
    fi
}

# 检查 Git 是否安装
check_git() {
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version 2>/dev/null | awk '{print $3}')
        log_success "Git 已安装: $GIT_VERSION"
        return 0
    else
        log_warn "Git 未安装"
        return 1
    fi
}

# 检查环境状态
check_environment() {
    echo ""
    echo -e "${CYAN}═══════════ 环境检查 ═══════════${NC}"
    echo ""
    
    check_docker
    check_docker_compose
    check_nodejs
    check_nginx
    check_git
    
    echo ""
}

# 安装 Docker
install_docker() {
    log_info "安装 Docker..."
    
    if check_docker &> /dev/null; then
        log_success "Docker 已存在，跳过安装"
        return 0
    fi
    
    # 安装 Docker
    curl -fsSL https://get.docker.com | sh
    
    # 启动 Docker
    systemctl start docker
    systemctl enable docker
    
    # 添加当前用户到 docker 组 (如果需要)
    # usermod -aG docker $USER
    
    log_success "Docker 安装完成"
}

# 安装 Docker Compose
install_docker_compose() {
    log_info "安装 Docker Compose..."
    
    if check_docker_compose &> /dev/null; then
        log_success "Docker Compose 已存在，跳过安装"
        return 0
    fi
    
    # 下载 Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # 赋予执行权限
    chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_success "Docker Compose 安装完成"
}

# 安装 Nginx
install_nginx() {
    log_info "安装 Nginx..."
    
    if check_nginx &> /dev/null; then
        log_success "Nginx 已存在，跳过安装"
        return 0
    fi
    
    apt update
    apt install -y nginx
    
    systemctl enable nginx
    systemctl start nginx
    
    log_success "Nginx 安装完成"
}

# 安装 Node.js
install_nodejs() {
    log_info "安装 Node.js 20..."
    
    if check_nodejs &> /dev/null; then
        log_success "Node.js 已存在，跳过安装"
        return 0
    fi
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # 验证安装
    node -v
    npm -v
    
    log_success "Node.js 安装完成"
}

# 安装 Git
install_git() {
    log_info "安装 Git..."
    
    if check_git &> /dev/null; then
        log_success "Git 已存在，跳过安装"
        return 0
    fi
    
    apt update
    apt install -y git
    
    log_success "Git 安装完成"
}

# 安装所有依赖
install_dependencies() {
    echo ""
    echo -e "${CYAN}═══════════ 安装依赖 ═══════════${NC}"
    echo ""
    
    install_git
    install_nodejs
    install_nginx
    install_docker
    install_docker_compose
    
    log_success "所有依赖安装完成"
}

# 生成 JWT 密钥
generate_jwt_secret() {
    openssl rand -base64 32
}

# 配置环境变量
setup_env() {
    log_info "配置环境变量..."
    
    ENV_FILE="$APP_DIR/.env"
    
    if [[ -f "$ENV_FILE" ]]; then
        log_warn ".env 文件已存在"
        read -p "是否覆盖? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_info "保留现有 .env 文件"
            return 0
        fi
    fi
    
    # 获取或生成 JWT Secret
    JWT_SECRET=$(grep JWT_SECRET "$ENV_FILE" 2>/dev/null | cut -d '=' -f2)
    if [[ -z "$JWT_SECRET" ]]; then
        JWT_SECRET=$(generate_jwt_secret)
    fi
    
    # 创建环境变量文件
    cat > "$ENV_FILE" << EOF
# LittleStoryChat 环境配置
PORT=$API_PORT
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$DOMAIN
DB_PATH=./data/hichat.db
EOF
    
    log_success "环境变量配置完成"
    log_info "JWT Secret: ${JWT_SECRET:0:20}..."
}

# 克隆项目
clone_project() {
    log_info "克隆项目..."
    
    if [[ -d "$APP_DIR" ]]; then
        log_warn "项目目录已存在: $APP_DIR"
        read -p "是否更新? (y/N): " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            cd "$APP_DIR"
            git pull origin main
            log_success "项目更新完成"
            return 0
        else
            log_info "使用现有项目"
            return 0
        fi
    fi
    
    # 创建目录
    mkdir -p "$(dirname "$APP_DIR")"
    
    # 克隆仓库
    git clone git@github.com:ttmanthatman/LittleStoryChat.git "$APP_DIR"
    
    log_success "项目克隆完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    
    cd "$APP_DIR/client"
    
    # 检查是否有 node_modules
    if [[ ! -d "node_modules" ]]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    # 构建
    npm run build
    
    log_success "前端构建完成"
}

# 启动 Docker 服务
start_docker_services() {
    log_info "启动 Docker 服务..."
    
    cd "$APP_DIR"
    
    # 检查 docker-compose.yml
    if [[ ! -f "docker-compose.yml" ]]; then
        log_error "docker-compose.yml 不存在"
        exit 1
    fi
    
    # 停止旧容器
    docker-compose down 2>/dev/null || true
    
    # 启动服务
    docker-compose up -d --build
    
    log_success "Docker 服务启动完成"
}

# 配置 Nginx
setup_nginx_config() {
    log_info "配置 Nginx..."
    
    # 创建 Nginx 配置
    cat > "/etc/nginx/sites-available/$APP_NAME" << EOF
# LittleStoryChat Nginx Configuration
server {
    listen 80;
    server_name $DOMAIN;

    # 前端静态文件
    root $APP_DIR/client/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 前端路由
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # WebSocket 代理
    location /socket.io {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

    # 启用配置
    ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"
    
    # 禁用默认配置
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    # 测试配置
    nginx -t
    
    # 重载 Nginx
    systemctl reload nginx
    
    log_success "Nginx 配置完成"
}

# 配置 SSL (Let's Encrypt)
setup_ssl() {
    log_info "配置 SSL 证书..."
    
    # 检查 certbot 是否安装
    if ! command -v certbot &> /dev/null; then
        apt install -y certbot python3-certbot-nginx
    fi
    
    # 获取证书
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@"$DOMAIN"
    
    # 自动续期
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    log_success "SSL 证书配置完成"
}

# 防火墙配置
setup_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        ufw --force enable
        ufw allow ssh
        ufw allow http
        ufw allow https
        ufw reload
        log_success "防火墙配置完成"
    else
        log_warn "UFW 未安装，跳过防火墙配置"
    fi
}

# 完整安装
do_install() {
    print_banner
    
    log_info "开始安装故事小站..."
    echo ""
    
    # 检查环境
    check_environment
    
    # 安装依赖
    install_dependencies
    
    # 克隆项目
    clone_project
    
    # 配置环境变量
    setup_env
    
    # 构建前端
    build_frontend
    
    # 启动 Docker 服务
    start_docker_services
    
    # 配置 Nginx
    setup_nginx_config
    
    echo ""
    echo -e "${CYAN}═══════════ 安装选项 ═══════════${NC}"
    echo ""
    read -p "是否配置 SSL 证书? (y/N): " setup_ssl_choice
    
    if [[ "$setup_ssl_choice" =~ ^[Yy]$ ]]; then
        setup_ssl
    fi
    
    # 配置防火墙
    read -p "是否配置防火墙? (y/N): " setup_fw_choice
    if [[ "$setup_fw_choice" =~ ^[Yy]$ ]]; then
        setup_firewall
    fi
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  安装完成!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    log_success "访问地址: https://$DOMAIN"
    log_info "API 端口: $API_PORT"
    log_info "项目目录: $APP_DIR"
    echo ""
    log_info "常用命令:"
    echo "  查看状态: ./deploy.sh status"
    echo "  查看日志: ./deploy.sh logs"
    echo "  重启服务: ./deploy.sh restart"
    echo "  更新代码: ./deploy.sh update"
    echo "  卸载:     ./deploy.sh uninstall"
    echo ""
}

# 更新部署
do_update() {
    print_banner
    
    log_info "更新故事小站..."
    
    # 检查项目目录
    if [[ ! -d "$APP_DIR" ]]; then
        log_error "项目未安装，请先运行 install"
        exit 1
    fi
    
    cd "$APP_DIR"
    
    # Git 拉取
    log_info "拉取最新代码..."
    git pull origin main
    
    # 更新依赖并构建
    log_info "重新构建..."
    cd client
    npm install
    npm run build
    cd ..
    
    # 重启服务
    log_info "重启服务..."
    docker-compose down
    docker-compose up -d --build
    
    # 重载 Nginx
    systemctl reload nginx
    
    log_success "更新完成!"
}

# 查看状态
do_status() {
    print_banner
    
    echo ""
    echo -e "${CYAN}═══════════ 环境状态 ═══════════${NC}"
    echo ""
    check_environment
    echo ""
    
    echo -e "${CYAN}═══════════ 服务状态 ═══════════${NC}"
    echo ""
    
    # Docker 容器状态
    if check_docker &> /dev/null; then
        log_info "Docker 容器:"
        cd "$APP_DIR"
        docker-compose ps 2>/dev/null || log_warn "容器未运行"
    fi
    
    echo ""
    
    # Nginx 状态
    log_info "Nginx 状态:"
    systemctl is-active nginx 2>/dev/null && log_success "Nginx 运行中" || log_error "Nginx 未运行"
    
    echo ""
    
    # API 健康检查
    log_info "API 健康检查:"
    if curl -sf "http://127.0.0.1:$API_PORT/health" > /dev/null 2>&1; then
        log_success "API 服务正常"
    else
        log_error "API 服务异常"
    fi
    
    echo ""
    
    # WebSocket 检查
    log_info "WebSocket 检查:"
    WEBSOCKET_CHECK=$(curl -sf "http://127.0.0.1:$API_PORT/socket.io/?EIO=4&transport=polling" 2>&1)
    if [[ $? -eq 0 ]]; then
        log_success "WebSocket 服务正常"
    else
        log_warn "WebSocket 服务可能未就绪"
    fi
    
    echo ""
}

# 查看日志
do_logs() {
    print_banner
    
    if [[ ! -d "$APP_DIR" ]]; then
        log_error "项目未安装"
        exit 1
    fi
    
    cd "$APP_DIR"
    
    if [[ "$1" == "--follow" ]] || [[ "$1" == "-f" ]]; then
        log_info "实时查看日志 (Ctrl+C 退出)..."
        docker-compose logs -f
    else
        log_info "最近 100 行日志:"
        docker-compose logs --tail=100
    fi
}

# 重启服务
do_restart() {
    print_banner
    
    log_info "重启服务..."
    
    cd "$APP_DIR"
    
    docker-compose restart
    systemctl reload nginx
    
    sleep 2
    
    if curl -sf "http://127.0.0.1:$API_PORT/health" > /dev/null 2>&1; then
        log_success "服务重启完成"
    else
        log_error "服务重启可能失败，请检查日志"
    fi
}

# 停止服务
do_stop() {
    print_banner
    
    log_info "停止服务..."
    
    cd "$APP_DIR"
    docker-compose down
    
    log_success "服务已停止"
}

# 卸载
do_uninstall() {
    print_banner
    
    log_warn "即将卸载故事小站!"
    echo ""
    
    read -p "确认卸载? (输入 'YES' 确认): " confirm
    if [[ "$confirm" != "YES" ]]; then
        log_info "取消卸载"
        exit 0
    fi
    
    log_info "开始卸载..."
    
    # 停止服务
    cd "$APP_DIR" 2>/dev/null && docker-compose down
    
    # 删除项目目录
    if [[ -d "$APP_DIR" ]]; then
        log_info "删除项目目录..."
        rm -rf "$APP_DIR"
    fi
    
    # 删除 Nginx 配置
    if [[ -f "/etc/nginx/sites-available/$APP_NAME" ]]; then
        log_info "删除 Nginx 配置..."
        rm -f "/etc/nginx/sites-available/$APP_NAME"
        rm -f "/etc/nginx/sites-enabled/$APP_NAME"
        systemctl reload nginx
    fi
    
    # 删除 SSL 证书
    if [[ -d "/etc/letsencrypt/live/$DOMAIN" ]]; then
        log_warn "SSL 证书未删除 (如需删除请手动: certbot delete --domain $DOMAIN)"
    fi
    
    log_success "卸载完成!"
}

# 显示帮助
show_help() {
    print_banner
    
    echo "用法: $0 <命令>"
    echo ""
    echo "命令:"
    echo "  install安装故事小站"
    echo "  update      更新故事小站"
    echo "  uninstall   卸载故事小站"
    echo "  status      查看状态"
    echo "  logs        查看日志 (加 -f 实时)"
    echo "  restart     重启服务"
    echo "  stop        停止服务"
    echo "  help        显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 install        # 安装"
    echo "  $0 status         # 查看状态"
    echo "  $0 logs -f        # 实时日志"
    echo ""
}

# ==================== 主程序 ====================

# 解析参数
COMMAND="${1:-help}"

case "$COMMAND" in
    install)
        check_root
        do_install
        ;;
    update)
        check_root
        do_update
        ;;
    uninstall)
        check_root
        do_uninstall
        ;;
    status)
        do_status
        ;;
    logs)
        do_logs "${2:-}"
        ;;
    restart)
        check_root
        do_restart
        ;;
    stop)
        check_root
        do_stop
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "未知命令: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac
