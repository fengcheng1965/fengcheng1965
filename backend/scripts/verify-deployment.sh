#!/bin/bash
# 部署验证脚本
# 苏顺植保网站 - 部署验证
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
API_URL="${API_URL:-http://localhost:3000}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-sushun_production}"

# 计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 函数定义
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

increment_total() {
    ((TOTAL_CHECKS++))
}

# 1. 环境变量检查
print_header "1. 环境变量检查"

increment_total
if [ -z "$DB_HOST" ]; then
    print_error "DB_HOST 环境变量未设置"
else
    print_success "DB_HOST 已设置: $DB_HOST"
fi

increment_total
if [ -z "$DB_USER" ]; then
    print_error "DB_USER 环境变量未设置"
else
    print_success "DB_USER 已设置: $DB_USER"
fi

increment_total
if [ -z "$DB_PASSWORD" ]; then
    print_error "DB_PASSWORD 环境变量未设置"
else
    print_success "DB_PASSWORD 已设置 (已隐藏)"
fi

increment_total
if [ -z "$DB_NAME" ]; then
    print_error "DB_NAME 环境变量未设置"
else
    print_success "DB_NAME 已设置: $DB_NAME"
fi

increment_total
if [ -z "$JWT_SECRET" ]; then
    print_error "JWT_SECRET 环境变量未设置"
else
    JWT_SECRET_LENGTH=${#JWT_SECRET}
    if [ $JWT_SECRET_LENGTH -ge 32 ]; then
        print_success "JWT_SECRET 已设置 (长度: $JWT_SECRET_LENGTH)"
    else
        print_warning "JWT_SECRET 长度过短 (当前: $JWT_SECRET_LENGTH, 建议: >= 32)"
    fi
fi

increment_total
if [ -z "$NODE_ENV" ]; then
    print_warning "NODE_ENV 环境变量未设置，使用默认值"
else
    print_success "NODE_ENV 已设置: $NODE_ENV"
fi

# 2. 文件系统检查
print_header "2. 文件系统检查"

increment_total
if [ -f ".env.production" ]; then
    print_success ".env.production 文件存在"
else
    print_error ".env.production 文件不存在"
fi

increment_total
if [ -f ".env" ]; then
    print_warning ".env 文件存在，确保它未被提交到版本控制"
else
    print_info ".env 文件不存在 (生产环境正常)"
fi

increment_total
if [ -d "logs" ]; then
    print_success "logs 目录存在"
else
    print_warning "logs 目录不存在，将创建"
    mkdir -p logs
fi

increment_total
if [ -d "uploads" ]; then
    print_success "uploads 目录存在"
else
    print_warning "uploads 目录不存在，将创建"
    mkdir -p uploads
fi

increment_total
if [ -d "node_modules" ]; then
    print_success "node_modules 目录存在"
else
    print_error "node_modules 目录不存在，请运行 npm install"
fi

# 3. 数据库连接检查
print_header "3. 数据库连接检查"

increment_total
print_info "检查数据库连接..."
if command -v mysql &> /dev/null; then
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
        print_success "数据库连接成功"
        
        increment_total
        TABLE_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME'" 2>/dev/null | tail -n 1)
        if [ -n "$TABLE_COUNT" ]; then
            print_success "数据库表数量: $TABLE_COUNT"
        else
            print_error "无法获取数据库表数量"
        fi
        
        increment_total
        PRODUCT_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM products" 2>/dev/null | tail -n 1)
        if [ -n "$PRODUCT_COUNT" ]; then
            print_success "产品数据数量: $PRODUCT_COUNT"
        else
            print_warning "无法获取产品数据数量"
        fi
    else
        print_error "数据库连接失败"
    fi
else
    print_error "mysql 命令不可用"
fi

# 4. API服务检查
print_header "4. API服务检查"

increment_total
print_info "检查API服务状态..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        print_success "API服务响应正常 (HTTP $HTTP_CODE)"
    else
        print_error "API服务响应异常 (HTTP $HTTP_CODE)"
    fi
    
    increment_total
    print_info "检查健康检查端点..."
    HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
        print_success "健康检查通过"
    else
        print_error "健康检查失败"
        echo "响应: $HEALTH_RESPONSE"
    fi
    
    increment_total
    print_info "测试产品API端点..."
    PRODUCTS_RESPONSE=$(curl -s "$API_URL/api/products")
    if echo "$PRODUCTS_RESPONSE" | grep -q '"success":true'; then
        print_success "产品API端点正常"
    else
        print_error "产品API端点异常"
    fi
    
    increment_total
    print_info "测试认证API端点..."
    AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}')
    if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
        print_success "认证API端点正常"
    else
        print_warning "认证API端点可能异常 (需要正确的凭据)"
    fi
else
    print_error "curl 命令不可用"
fi

# 5. 性能基准测试
print_header "5. 性能基准测试"

increment_total
print_info "测试API响应时间..."
START_TIME=$(date +%s%N)
curl -s "$HEALTH_URL" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$((END_TIME - START_TIME))

if [ $RESPONSE_TIME -lt 1000 ]; then
    print_success "API响应时间: ${RESPONSE_TIME}ms (优秀)"
elif [ $RESPONSE_TIME -lt 3000 ]; then
    print_success "API响应时间: ${RESPONSE_TIME}ms (良好)"
else
    print_warning "API响应时间: ${RESPONSE_TIME}ms (需要优化)"
fi

increment_total
print_info "测试数据库查询性能..."
DB_QUERY_START=$(date +%s%N)
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -D"$DB_NAME" -e "SELECT COUNT(*) FROM products" > /dev/null 2>&1
DB_QUERY_END=$(date +%s%N)
DB_QUERY_TIME=$((DB_QUERY_END - DB_QUERY_START))

if [ $DB_QUERY_TIME -lt 100 ]; then
    print_success "数据库查询时间: ${DB_QUERY_TIME}ms (优秀)"
elif [ $DB_QUERY_TIME -lt 500 ]; then
    print_success "数据库查询时间: ${DB_QUERY_TIME}ms (良好)"
else
    print_warning "数据库查询时间: ${DB_QUERY_TIME}ms (需要优化)"
fi

# 6. 安全配置检查
print_header "6. 安全配置检查"

increment_total
if [ -f ".env" ]; then
    ENV_PERMS=$(stat -c %a .env 2>/dev/null || echo "unknown")
    if [ "$ENV_PERMS" = "600" ]; then
        print_success ".env 文件权限正确 (600)"
    else
        print_warning ".env 文件权限不安全 (当前: $ENV_PERMS, 建议: 600)"
    fi
else
    print_info ".env 文件不存在 (生产环境正常)"
fi

increment_total
if [ -n "$JWT_SECRET" ]; then
    JWT_SECRET_LENGTH=${#JWT_SECRET}
    if [ $JWT_SECRET_LENGTH -ge 32 ]; then
        print_success "JWT_SECRET 强度符合要求 (长度: $JWT_SECRET_LENGTH)"
    else
        print_warning "JWT_SECRET 强度不足 (当前: $JWT_SECRET_LENGTH, 建议: >= 32)"
    fi
fi

increment_total
if [ "$NODE_ENV" = "production" ]; then
    print_success "NODE_ENV 设置为 production"
else
    print_warning "NODE_ENV 未设置为 production (当前: $NODE_ENV)"
fi

# 7. 监控系统检查
print_header "7. 监控系统检查"

increment_total
if [ -d "logs" ]; then
    LOG_FILES=$(find logs -name "*.log" -type f | wc -l)
    if [ $LOG_FILES -gt 0 ]; then
        print_success "日志文件数量: $LOG_FILES"
    else
        print_warning "未找到日志文件"
    fi
else
    print_error "logs 目录不存在"
fi

increment_total
if [ -f "logs/app.log" ]; then
    LOG_SIZE=$(du -h logs/app.log | cut -f1)
    print_success "应用日志文件大小: $LOG_SIZE"
else
    print_warning "应用日志文件不存在"
fi

increment_total
if [ -f "logs/error.log" ]; then
    ERROR_COUNT=$(grep -c "ERROR" logs/error.log 2>/dev/null || echo "0")
    print_success "错误日志文件存在 (错误数: $ERROR_COUNT)"
else
    print_warning "错误日志文件不存在"
fi

# 8. 依赖检查
print_header "8. 依赖检查"

increment_total
if [ -f "package.json" ]; then
    print_success "package.json 文件存在"
    
    increment_total
    if [ -f "package-lock.json" ]; then
        print_success "package-lock.json 文件存在"
    else
        print_warning "package-lock.json 文件不存在"
    fi
    
    increment_total
    if [ -d "node_modules" ]; then
        DEPENDENCY_COUNT=$(ls node_modules | wc -l)
        print_success "依赖已安装 (数量: $DEPENDENCY_COUNT)"
    else
        print_error "依赖未安装"
    fi
else
    print_error "package.json 文件不存在"
fi

# 9. 端口检查
print_header "9. 端口检查"

increment_total
if command -v netstat &> /dev/null; then
    if netstat -tuln | grep -q ":3000 "; then
        print_success "端口 3000 正在监听"
    else
        print_error "端口 3000 未监听"
    fi
    
    increment_total
    if netstat -tuln | grep -q ":3306 "; then
        print_success "端口 3306 正在监听 (MySQL)"
    else
        print_warning "端口 3306 未监听 (MySQL)"
    fi
else
    print_warning "netstat 命令不可用"
fi

# 10. 系统资源检查
print_header "10. 系统资源检查"

increment_total
if command -v free &> /dev/null; then
    MEMORY_TOTAL=$(free -m | awk 'NR==2{print $2}')
    MEMORY_USED=$(free -m | awk 'NR==2{print $3}')
    MEMORY_PERCENT=$((MEMORY_USED * 100 / MEMORY_TOTAL))
    
    if [ $MEMORY_PERCENT -lt 80 ]; then
        print_success "内存使用率: ${MEMORY_PERCENT}% (正常)"
    elif [ $MEMORY_PERCENT -lt 90 ]; then
        print_warning "内存使用率: ${MEMORY_PERCENT}% (偏高)"
    else
        print_error "内存使用率: ${MEMORY_PERCENT}% (过高)"
    fi
else
    print_warning "free 命令不可用"
fi

increment_total
if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    
    if [ $DISK_USAGE -lt 80 ]; then
        print_success "磁盘使用率: ${DISK_USAGE}% (正常)"
    elif [ $DISK_USAGE -lt 90 ]; then
        print_warning "磁盘使用率: ${DISK_USAGE}% (偏高)"
    else
        print_error "磁盘使用率: ${DISK_USAGE}% (过高)"
    fi
else
    print_warning "df 命令不可用"
fi

# 生成总结报告
print_header "部署验证总结"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}总检查数: $TOTAL_CHECKS${NC}"
echo -e "${GREEN}通过检查: $PASSED_CHECKS${NC}"
echo -e "${RED}失败检查: $FAILED_CHECKS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo -e "${BLUE}成功率: ${SUCCESS_RATE}%${NC}"

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 所有检查通过！部署验证成功！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  部分检查失败，请检查上述错误${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
