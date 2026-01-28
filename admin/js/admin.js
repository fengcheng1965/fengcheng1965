const API_BASE_URL = 'http://localhost:3000';

let performanceChart = null;
let resourceChart = null;
let cpuChart = null;
let memoryChart = null;
let networkChart = null;
let dbChart = null;
let monitoringInterval = null;
let apiCallCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeDashboard();
    initializeCharts();
    initializeServices();
    initializeModels();
    initializeAPI();
    initializePermissions();
    initializeMonitoring();
    initializeLogs();
    initializeSettings();
    startRealTimeUpdates();
});

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('current-page-title');

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(`${targetPage}-page`).classList.add('active');
            
            pageTitle.textContent = this.querySelector('span').textContent;
        });
    });

    document.getElementById('refresh-btn').addEventListener('click', refreshCurrentPage);
}

function initializeDashboard() {
    updateSystemStats();
    loadRecentActivity();
}

async function updateSystemStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        
        if (data.success) {
            updateUptime(data.uptime);
            updateMemoryUsage(data.memory);
            document.getElementById('db-connections').textContent = '5/20';
        }
    } catch (error) {
        console.error('Failed to fetch system stats:', error);
    }
}

function updateUptime(uptime) {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    document.getElementById('uptime').textContent = `${days}天 ${hours}小时 ${minutes}分钟`;
}

function updateMemoryUsage(memory) {
    document.getElementById('memory-usage').textContent = memory.used;
    document.getElementById('total-memory').textContent = memory.total;
}

function loadRecentActivity() {
    const activities = [
        { time: '刚刚', desc: '系统启动成功' },
        { time: '1分钟前', desc: '用户登录: admin' },
        { time: '5分钟前', desc: 'API调用: GET /api/products' },
        { time: '10分钟前', desc: '数据库连接池优化' },
        { time: '15分钟前', desc: '日志文件轮转完成' }
    ];

    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <span class="activity-time">${activity.time}</span>
            <span class="activity-desc">${activity.desc}</span>
        </div>
    `).join('');
}

function initializeCharts() {
    initializePerformanceChart();
    initializeResourceChart();
    initializeMonitoringCharts();
}

function initializePerformanceChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [{
                label: 'API响应时间 (ms)',
                data: [120, 132, 101, 134, 90, 230, 210],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: '数据库查询时间 (ms)',
                data: [45, 52, 38, 48, 35, 65, 58],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initializeResourceChart() {
    const ctx = document.getElementById('resourceChart').getContext('2d');
    resourceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['内存使用', '内存空闲', '缓存使用', '缓存空闲'],
            datasets: [{
                data: [15, 2, 30, 70],
                backgroundColor: ['#3498db', '#ecf0f1', '#27ae60', '#95a5a6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

function initializeMonitoringCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        },
        animation: {
            duration: 0
        }
    };

    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                data: Array(20).fill(0),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: chartOptions
    });

    const memoryCtx = document.getElementById('memoryChart').getContext('2d');
    memoryChart = new Chart(memoryCtx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                data: Array(20).fill(0),
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: chartOptions
    });

    const networkCtx = document.getElementById('networkChart').getContext('2d');
    networkChart = new Chart(networkCtx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                data: Array(20).fill(0),
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: chartOptions
    });

    const dbCtx = document.getElementById('dbChart').getContext('2d');
    dbChart = new Chart(dbCtx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                data: Array(20).fill(0),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: chartOptions
    });
}

function initializeServices() {
    const services = [
        {
            name: '后端API服务',
            icon: 'fa-server',
            status: 'running',
            port: 3000,
            uptime: '2小时15分钟',
            memory: '15MB'
        },
        {
            name: '数据库服务',
            icon: 'fa-database',
            status: 'running',
            port: 3306,
            uptime: '2小时15分钟',
            memory: '45MB'
        },
        {
            name: '缓存服务',
            icon: 'fa-bolt',
            status: 'stopped',
            port: 6379,
            uptime: '-',
            memory: '-'
        },
        {
            name: '前端Web服务',
            icon: 'fa-globe',
            status: 'running',
            port: 8080,
            uptime: '2小时15分钟',
            memory: '8MB'
        }
    ];

    const servicesGrid = document.getElementById('services-grid');
    servicesGrid.innerHTML = services.map(service => `
        <div class="service-card">
            <div class="service-header">
                <h3><i class="fas ${service.icon}"></i> ${service.name}</h3>
                <span class="service-status ${service.status}">${service.status === 'running' ? '运行中' : '已停止'}</span>
            </div>
            <div class="service-info">
                <p><i class="fas fa-network-wired"></i> 端口: ${service.port}</p>
                <p><i class="fas fa-clock"></i> 运行时间: ${service.uptime}</p>
                <p><i class="fas fa-memory"></i> 内存使用: ${service.memory}</p>
            </div>
            <div class="service-actions">
                <button class="btn btn-success" onclick="startService('${service.name}')">
                    <i class="fas fa-play"></i> 启动
                </button>
                <button class="btn btn-warning" onclick="restartService('${service.name}')">
                    <i class="fas fa-redo"></i> 重启
                </button>
                <button class="btn btn-danger" onclick="stopService('${service.name}')">
                    <i class="fas fa-stop"></i> 停止
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('start-all-services').addEventListener('click', startAllServices);
}

function startService(serviceName) {
    showNotification(`正在启动 ${serviceName}...`, 'info');
    setTimeout(() => {
        showNotification(`${serviceName} 启动成功`, 'success');
    }, 1000);
}

function stopService(serviceName) {
    if (confirm(`确定要停止 ${serviceName} 吗？`)) {
        showNotification(`正在停止 ${serviceName}...`, 'info');
        setTimeout(() => {
            showNotification(`${serviceName} 已停止`, 'success');
        }, 1000);
    }
}

function restartService(serviceName) {
    showNotification(`正在重启 ${serviceName}...`, 'info');
    setTimeout(() => {
        showNotification(`${serviceName} 重启成功`, 'success');
    }, 2000);
}

function startAllServices() {
    showNotification('正在启动所有服务...', 'info');
    setTimeout(() => {
        showNotification('所有服务启动成功', 'success');
    }, 2000);
}

function initializeModels() {
    const models = [
        {
            name: '用户模型 (Users)',
            icon: 'fa-user',
            fields: [
                { name: 'id', type: 'INT (主键)' },
                { name: 'username', type: 'VARCHAR(50)' },
                { name: 'email', type: 'VARCHAR(100)' },
                { name: 'password', type: 'VARCHAR(255)' },
                { name: 'role', type: 'ENUM' }
            ]
        },
        {
            name: '产品模型 (Products)',
            icon: 'fa-box',
            fields: [
                { name: 'id', type: 'INT (主键)' },
                { name: 'name', type: 'VARCHAR(100)' },
                { name: 'description', type: 'TEXT' },
                { name: 'price', type: 'DECIMAL(10,2)' },
                { name: 'stock', type: 'INT' }
            ]
        },
        {
            name: '客户模型 (Customers)',
            icon: 'fa-users',
            fields: [
                { name: 'id', type: 'INT (主键)' },
                { name: 'name', type: 'VARCHAR(100)' },
                { name: 'phone', type: 'VARCHAR(20)' },
                { name: 'email', type: 'VARCHAR(100)' },
                { name: 'address', type: 'TEXT' }
            ]
        }
    ];

    const modelsContainer = document.getElementById('models-container');
    modelsContainer.innerHTML = models.map(model => `
        <div class="model-card">
            <h3><i class="fas ${model.icon}"></i> ${model.name}</h3>
            <div class="model-fields">
                ${model.fields.map(field => `
                    <div class="field-item">
                        <span class="field-name">${field.name}</span>
                        <span class="field-type">${field.type}</span>
                    </div>
                `).join('')}
            </div>
            <div class="service-actions">
                <button class="btn btn-primary" onclick="editModel('${model.name}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-danger" onclick="deleteModel('${model.name}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('add-model-btn').addEventListener('click', addModel);
}

function addModel() {
    showNotification('添加模型功能开发中...', 'info');
}

function editModel(modelName) {
    showNotification(`编辑模型: ${modelName}`, 'info');
}

function deleteModel(modelName) {
    if (confirm(`确定要删除 ${modelName} 吗？`)) {
        showNotification(`${modelName} 已删除`, 'success');
    }
}

function initializeAPI() {
    const apis = [
        {
            name: '认证接口',
            icon: 'fa-lock',
            endpoints: [
                { path: '/api/auth/login', method: 'POST', desc: '用户登录' },
                { path: '/api/auth/register', method: 'POST', desc: '用户注册' },
                { path: '/api/auth/logout', method: 'POST', desc: '用户登出' }
            ]
        },
        {
            name: '产品接口',
            icon: 'fa-box',
            endpoints: [
                { path: '/api/products', method: 'GET', desc: '获取产品列表' },
                { path: '/api/products/:id', method: 'GET', desc: '获取产品详情' },
                { path: '/api/products', method: 'POST', desc: '创建产品' }
            ]
        },
        {
            name: '客户接口',
            icon: 'fa-users',
            endpoints: [
                { path: '/api/customers', method: 'GET', desc: '获取客户列表' },
                { path: '/api/customers/:id', method: 'GET', desc: '获取客户详情' },
                { path: '/api/customers', method: 'POST', desc: '创建客户' }
            ]
        }
    ];

    const apiContainer = document.getElementById('api-config-container');
    apiContainer.innerHTML = apis.map(api => `
        <div class="api-card">
            <h3><i class="fas ${api.icon}"></i> ${api.name}</h3>
            <div class="api-endpoints">
                ${api.endpoints.map(endpoint => `
                    <div class="endpoint-item">
                        <span class="endpoint-path">${endpoint.method} ${endpoint.path}</span>
                        <span class="endpoint-desc">${endpoint.desc}</span>
                    </div>
                `).join('')}
            </div>
            <div class="service-actions">
                <button class="btn btn-primary" onclick="testAPI('${api.name}')">
                    <i class="fas fa-vial"></i> 测试
                </button>
                <button class="btn btn-warning" onclick="editAPI('${api.name}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('add-api-btn').addEventListener('click', addAPI);
}

function addAPI() {
    showNotification('添加接口功能开发中...', 'info');
}

function testAPI(apiName) {
    showNotification(`正在测试 ${apiName}...`, 'info');
    setTimeout(() => {
        showNotification(`${apiName} 测试通过`, 'success');
    }, 1500);
}

function editAPI(apiName) {
    showNotification(`编辑接口: ${apiName}`, 'info');
}

function initializePermissions() {
    const permissions = [
        {
            name: '管理员角色',
            icon: 'fa-user-shield',
            permissions: [
                { name: '用户管理', desc: '管理所有用户账户' },
                { name: '角色管理', desc: '管理系统角色和权限' },
                { name: '系统设置', desc: '修改系统配置' }
            ]
        },
        {
            name: '普通用户角色',
            icon: 'fa-user',
            permissions: [
                { name: '查看产品', desc: '浏览产品信息' },
                { name: '查看客户', desc: '浏览客户信息' },
                { name: '创建留言', desc: '提交客户留言' }
            ]
        }
    ];

    const permissionsContainer = document.getElementById('permissions-container');
    permissionsContainer.innerHTML = permissions.map(perm => `
        <div class="permission-card">
            <h3><i class="fas ${perm.icon}"></i> ${perm.name}</h3>
            <div class="permission-list">
                ${perm.permissions.map(p => `
                    <div class="permission-item">
                        <span class="permission-name">${p.name}</span>
                        <span class="permission-desc">${p.desc}</span>
                    </div>
                `).join('')}
            </div>
            <div class="service-actions">
                <button class="btn btn-primary" onclick="editPermission('${perm.name}')">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-danger" onclick="deletePermission('${perm.name}')">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('add-role-btn').addEventListener('click', addRole);
}

function addRole() {
    showNotification('添加角色功能开发中...', 'info');
}

function editPermission(roleName) {
    showNotification(`编辑角色: ${roleName}`, 'info');
}

function deletePermission(roleName) {
    if (confirm(`确定要删除 ${roleName} 吗？`)) {
        showNotification(`${roleName} 已删除`, 'success');
    }
}

function initializeMonitoring() {
    document.getElementById('start-monitoring').addEventListener('click', startMonitoring);
    document.getElementById('stop-monitoring').addEventListener('click', stopMonitoring);
}

function startMonitoring() {
    if (monitoringInterval) {
        showNotification('监控已在运行中', 'warning');
        return;
    }

    showNotification('实时监控已启动', 'success');
    monitoringInterval = setInterval(updateMonitoringData, 2000);
}

function stopMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        showNotification('实时监控已停止', 'success');
    }
}

function updateMonitoringData() {
    const cpu = Math.floor(Math.random() * 30) + 10;
    const memory = Math.floor(Math.random() * 20) + 10;
    const network = Math.floor(Math.random() * 100) + 50;
    const db = Math.floor(Math.random() * 50) + 10;

    updateMonitorChart(cpuChart, cpu);
    updateMonitorChart(memoryChart, memory);
    updateMonitorChart(networkChart, network);
    updateMonitorChart(dbChart, db);

    document.getElementById('cpu-usage').textContent = `${cpu}%`;
    document.getElementById('memory-usage-percent').textContent = `${memory}%`;
    document.getElementById('network-usage').textContent = `${network} KB/s`;
    document.getElementById('db-queries').textContent = db;
}

function updateMonitorChart(chart, value) {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(value);
    chart.update('none');
}

function initializeLogs() {
    loadLogs();
    
    document.getElementById('refresh-logs').addEventListener('click', loadLogs);
    document.getElementById('download-logs').addEventListener('click', downloadLogs);
    document.getElementById('log-level').addEventListener('change', filterLogs);
}

function loadLogs() {
    const logs = [
        { time: '2026-01-29 15:45:23', level: 'info', message: '服务器启动成功，监听端口: 3000' },
        { time: '2026-01-29 15:45:24', level: 'info', message: '数据库连接成功' },
        { time: '2026-01-29 15:45:25', level: 'info', message: '健康检查端点已注册' },
        { time: '2026-01-29 15:46:10', level: 'info', message: '用户登录: admin' },
        { time: '2026-01-29 15:46:15', level: 'info', message: 'API调用: GET /api/products' },
        { time: '2026-01-29 15:46:20', level: 'warn', message: '数据库查询时间较长: 150ms' },
        { time: '2026-01-29 15:47:00', level: 'info', message: '缓存命中率: 85%' },
        { time: '2026-01-29 15:47:30', level: 'error', message: '连接超时: Redis连接失败' },
        { time: '2026-01-29 15:48:00', level: 'info', message: '日志文件轮转完成' },
        { time: '2026-01-29 15:48:15', level: 'debug', message: '内存使用: 15MB/17MB' }
    ];

    const logsContainer = document.getElementById('logs-container');
    logsContainer.innerHTML = logs.map(log => `
        <div class="log-entry ${log.level}">
            <span class="log-time">${log.time}</span>
            <span class="log-level ${log.level}">${log.level.toUpperCase()}</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');
}

function filterLogs() {
    const level = document.getElementById('log-level').value;
    const logEntries = document.querySelectorAll('.log-entry');
    
    logEntries.forEach(entry => {
        if (level === 'all' || entry.classList.contains(level)) {
            entry.style.display = 'block';
        } else {
            entry.style.display = 'none';
        }
    });
}

function downloadLogs() {
    showNotification('日志下载功能开发中...', 'info');
}

function initializeSettings() {
    document.getElementById('save-settings').addEventListener('click', saveSettings);
}

function saveSettings() {
    showNotification('设置保存成功！', 'success');
}

function startRealTimeUpdates() {
    setInterval(() => {
        updateSystemStats();
        updateAPICallCount();
    }, 5000);
}

function updateAPICallCount() {
    apiCallCount += Math.floor(Math.random() * 5);
    document.getElementById('api-calls').textContent = apiCallCount;
}

function refreshCurrentPage() {
    const activePage = document.querySelector('.page.active');
    const pageId = activePage.id;
    
    switch(pageId) {
        case 'dashboard-page':
            updateSystemStats();
            break;
        case 'services-page':
            initializeServices();
            break;
        case 'models-page':
            initializeModels();
            break;
        case 'api-page':
            initializeAPI();
            break;
        case 'permissions-page':
            initializePermissions();
            break;
        case 'logs-page':
            loadLogs();
            break;
        default:
            break;
    }
    
    showNotification('页面刷新成功', 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left: 4px solid #27ae60;
    }
    
    .notification-error {
        border-left: 4px solid #e74c3c;
    }
    
    .notification-warning {
        border-left: 4px solid #f39c12;
    }
    
    .notification-info {
        border-left: 4px solid #3498db;
    }
    
    .notification i {
        font-size: 1.2rem;
    }
    
    .notification-success i {
        color: #27ae60;
    }
    
    .notification-error i {
        color: #e74c3c;
    }
    
    .notification-warning i {
        color: #f39c12;
    }
    
    .notification-info i {
        color: #3498db;
    }
`;
document.head.appendChild(style);