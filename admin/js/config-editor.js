let jsPlumbInstance = null;
let selectedNode = null;
let nodeCounter = 4;
let connections = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeConfigEditor();
});

function initializeConfigEditor() {
    initializeJSPlumb();
    initializeDragAndDrop();
    initializeNodeInteractions();
    initializeToolbar();
    initializeModal();
    initializeButtons();
}

function initializeJSPlumb() {
    jsPlumbInstance = jsPlumb.getInstance({
        Connector: ['Bezier', { curviness: 50 }],
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        PaintStyle: { stroke: '#3498db', strokeWidth: 2 },
        EndpointStyle: { fill: '#3498db', radius: 6 },
        HoverPaintStyle: { stroke: '#2980b9', strokeWidth: 3 },
        EndpointHoverStyle: { fill: '#2980b9' },
        Container: 'canvas-content'
    });

    jsPlumbInstance.importDefaults({
        ConnectionsDetachable: true,
        ReattachConnections: true,
        ConnectionOverlays: [
            ['Arrow', { location: 1, length: 12, width: 12, id: 'arrow' }]
        ]
    });

    const nodes = document.querySelectorAll('.node');
    nodes.forEach(node => {
        const nodeId = node.id;
        const inputPort = node.querySelector('.port-input');
        const outputPort = node.querySelector('.port-output');

        if (outputPort) {
            jsPlumbInstance.addEndpoint(nodeId, {
                anchor: 'Right',
                isSource: true,
                maxConnections: -1,
                connector: ['Bezier', { curviness: 50 }],
                endpoint: ['Dot', { radius: 6 }]
            });
        }

        if (inputPort) {
            jsPlumbInstance.addEndpoint(nodeId, {
                anchor: 'Left',
                isTarget: true,
                maxConnections: 1,
                endpoint: ['Dot', { radius: 6 }]
            });
        }

        jsPlumbInstance.draggable(nodeId, {
            containment: 'parent'
        });

        node.addEventListener('click', function(e) {
            if (!e.target.closest('.node-delete')) {
                selectNode(this);
            }
        });
    });

    jsPlumbInstance.bind('connection', function(info) {
        connections.push({
            source: info.sourceId,
            target: info.targetId
        });
        updateCodePreview();
        validateConfiguration();
    });

    jsPlumbInstance.bind('connectionDetached', function(info) {
        connections = connections.filter(conn => 
            conn.source !== info.sourceId || conn.target !== info.targetId
        );
        updateCodePreview();
        validateConfiguration();
    });
}

function initializeDragAndDrop() {
    const components = document.querySelectorAll('.component-item');
    const canvas = document.getElementById('config-canvas');

    components.forEach(component => {
        component.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('componentType', this.getAttribute('data-type'));
            e.dataTransfer.effectAllowed = 'copy';
        });
    });

    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        const componentType = e.dataTransfer.getData('componentType');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        createNode(componentType, x, y);
    });
}

function createNode(type, x, y) {
    nodeCounter++;
    const nodeId = `node-${nodeCounter}`;
    
    const nodeConfig = getNodeConfig(type);
    
    const nodeHTML = `
        <div class="node ${type}-node" id="${nodeId}" data-type="${type}" style="left: ${x}px; top: ${y}px;">
            <div class="node-header">
                <i class="fas ${nodeConfig.icon}"></i>
                <span>${nodeConfig.title}</span>
                <button class="node-delete" onclick="deleteNode('${nodeId}')"><i class="fas fa-times"></i></button>
            </div>
            <div class="node-body">
                <div class="node-info">
                    ${nodeConfig.info.map(info => `<span>${info}</span>`).join('')}
                </div>
                <div class="node-ports">
                    <div class="port port-input" data-port="in">输入</div>
                    <div class="port port-output" data-port="out">输出</div>
                </div>
            </div>
        </div>
    `;

    const canvasContent = document.getElementById('canvas-content');
    canvasContent.insertAdjacentHTML('beforeend', nodeHTML);
    const newNode = document.getElementById(nodeId);

    jsPlumbInstance.addEndpoint(nodeId, {
        anchor: 'Right',
        isSource: true,
        maxConnections: -1,
        connector: ['Bezier', { curviness: 50 }],
        endpoint: ['Dot', { radius: 6 }]
    });

    jsPlumbInstance.addEndpoint(nodeId, {
        anchor: 'Left',
        isTarget: true,
        maxConnections: 1,
        endpoint: ['Dot', { radius: 6 }]
    });

    jsPlumbInstance.draggable(nodeId, {
        containment: 'parent'
    });

    newNode.addEventListener('click', function(e) {
        if (!e.target.closest('.node-delete')) {
            selectNode(this);
        }
    });

    updateCodePreview();
    validateConfiguration();
    showNotification(`已创建 ${nodeConfig.title} 节点`, 'success');
}

function getNodeConfig(type) {
    const configs = {
        endpoint: {
            icon: 'fa-route',
            title: '接口端点',
            info: ['方法: GET', '路径: /api/new', '认证: 否']
        },
        auth: {
            icon: 'fa-shield-alt',
            title: 'JWT认证',
            info: ['类型: Bearer Token', '密钥: JWT_SECRET', '过期: 7天']
        },
        validator: {
            icon: 'fa-check-double',
            title: '数据验证',
            info: ['规则: Joi Schema', '严格模式: 是', '错误提示: 是']
        },
        logger: {
            icon: 'fa-file-alt',
            title: '请求日志',
            info: ['级别: INFO', '格式: JSON', '文件: app.log']
        },
        cache: {
            icon: 'fa-bolt',
            title: '缓存控制',
            info: ['类型: Redis', 'TTL: 3600s', '策略: LRU']
        },
        'rate-limit': {
            icon: 'fa-tachometer-alt',
            title: '速率限制',
            info: ['窗口: 15分钟', '最大: 100请求', 'IP限制: 是']
        },
        cors: {
            icon: 'fa-globe',
            title: 'CORS配置',
            info: ['允许: *', '方法: GET,POST', '凭证: 是']
        },
        'error-handler': {
            icon: 'fa-exclamation-triangle',
            title: '错误处理',
            info: ['类型: 全局', '日志: 是', '状态码: 500']
        }
    };

    return configs[type] || configs.endpoint;
}

function selectNode(node) {
    document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
    node.classList.add('selected');
    selectedNode = node;
    updatePropertiesPanel(node);
    updateCodePreview();
}

function updatePropertiesPanel(node) {
    const propertiesForm = document.getElementById('properties-form');
    const nodeType = node.getAttribute('data-type');
    const nodeId = node.id;

    const properties = getNodeProperties(nodeType);
    
    propertiesForm.innerHTML = properties.map(prop => `
        <div class="form-group">
            <label>${prop.label}</label>
            <input type="${prop.type}" 
                   class="form-control" 
                   id="prop-${prop.key}"
                   value="${prop.value}"
                   ${prop.readonly ? 'readonly' : ''}
                   onchange="updateNodeProperty('${nodeId}', '${prop.key}', this.value)">
        </div>
    `).join('');
}

function getNodeProperties(type) {
    const properties = {
        endpoint: [
            { key: 'method', label: '请求方法', type: 'text', value: 'GET', readonly: false },
            { key: 'path', label: '请求路径', type: 'text', value: '/api/products', readonly: false },
            { key: 'auth', label: '需要认证', type: 'checkbox', value: 'false', readonly: false }
        ],
        auth: [
            { key: 'type', label: '认证类型', type: 'text', value: 'Bearer Token', readonly: false },
            { key: 'secret', label: '密钥变量', type: 'text', value: 'JWT_SECRET', readonly: false },
            { key: 'expires', label: '过期时间', type: 'text', value: '7d', readonly: false }
        ],
        validator: [
            { key: 'schema', label: '验证规则', type: 'text', value: 'Joi Schema', readonly: false },
            { key: 'strict', label: '严格模式', type: 'checkbox', value: 'true', readonly: false }
        ],
        logger: [
            { key: 'level', label: '日志级别', type: 'select', value: 'INFO', readonly: false },
            { key: 'format', label: '日志格式', type: 'text', value: 'JSON', readonly: false },
            { key: 'file', label: '日志文件', type: 'text', value: 'app.log', readonly: false }
        ],
        cache: [
            { key: 'type', label: '缓存类型', type: 'text', value: 'Redis', readonly: false },
            { key: 'ttl', label: '过期时间(秒)', type: 'number', value: '3600', readonly: false },
            { key: 'strategy', label: '缓存策略', type: 'text', value: 'LRU', readonly: false }
        ],
        'rate-limit': [
            { key: 'window', label: '时间窗口(分钟)', type: 'number', value: '15', readonly: false },
            { key: 'max', label: '最大请求数', type: 'number', value: '100', readonly: false },
            { key: 'ipLimit', label: 'IP限制', type: 'checkbox', value: 'true', readonly: false }
        ],
        cors: [
            { key: 'origin', label: '允许来源', type: 'text', value: '*', readonly: false },
            { key: 'methods', label: '允许方法', type: 'text', value: 'GET,POST,PUT,DELETE', readonly: false },
            { key: 'credentials', label: '允许凭证', type: 'checkbox', value: 'true', readonly: false }
        ],
        'error-handler': [
            { key: 'type', label: '处理类型', type: 'text', value: '全局', readonly: false },
            { key: 'logging', label: '记录日志', type: 'checkbox', value: 'true', readonly: false },
            { key: 'statusCode', label: '错误状态码', type: 'number', value: '500', readonly: false }
        ]
    };

    return properties[type] || [];
}

function updateNodeProperty(nodeId, key, value) {
    const node = document.getElementById(nodeId);
    const nodeInfo = node.querySelector('.node-info');
    
    const spans = nodeInfo.querySelectorAll('span');
    if (spans.length > 0) {
        spans[0].textContent = `${key}: ${value}`;
    }
    
    updateCodePreview();
}

function deleteNode(nodeId) {
    const node = document.getElementById(nodeId);
    if (node) {
        jsPlumbInstance.removeAllEndpoints(nodeId);
        node.remove();
        
        connections = connections.filter(conn => 
            conn.source !== nodeId && conn.target !== nodeId
        );
        
        if (selectedNode && selectedNode.id === nodeId) {
            selectedNode = null;
            document.getElementById('properties-form').innerHTML = '<p class="no-selection">请选择一个节点以编辑属性</p>';
        }
        
        updateCodePreview();
        validateConfiguration();
        showNotification('节点已删除', 'success');
    }
}

function initializeNodeInteractions() {
    document.querySelectorAll('.node-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const node = this.closest('.node');
            if (confirm('确定要删除这个节点吗？')) {
                deleteNode(node.id);
            }
        });
    });
}

function initializeToolbar() {
    document.getElementById('zoom-in').addEventListener('click', () => zoomCanvas(1.2));
    document.getElementById('zoom-out').addEventListener('click', () => zoomCanvas(0.8));
    document.getElementById('fit-canvas').addEventListener('click', fitCanvasToView);
    document.getElementById('auto-layout').addEventListener('click', autoLayoutNodes);
}

let currentZoom = 1;

function zoomCanvas(factor) {
    currentZoom *= factor;
    currentZoom = Math.max(0.5, Math.min(2, currentZoom));
    
    const canvasContent = document.getElementById('canvas-content');
    canvasContent.style.transform = `scale(${currentZoom})`;
    canvasContent.style.transformOrigin = 'top left';
}

function fitCanvasToView() {
    currentZoom = 1;
    const canvasContent = document.getElementById('canvas-content');
    canvasContent.style.transform = 'scale(1)';
}

function autoLayoutNodes() {
    const nodes = document.querySelectorAll('.node');
    const canvasWidth = document.getElementById('config-canvas').offsetWidth;
    const canvasHeight = document.getElementById('config-canvas').offsetHeight;
    
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const nodeWidth = 220;
    const nodeHeight = 150;
    const gap = 50;
    
    nodes.forEach((node, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const x = col * (nodeWidth + gap) + 50;
        const y = row * (nodeHeight + gap) + 50;
        
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
    });
    
    jsPlumbInstance.repaintEverything();
    showNotification('自动布局完成', 'success');
}

function updateCodePreview() {
    const codePreview = document.getElementById('code-preview');
    const nodes = document.querySelectorAll('.node');
    
    if (nodes.length === 0) {
        codePreview.innerHTML = '<pre><code>// 画布为空</code></pre>';
        return;
    }
    
    let code = '// 生成的Express路由配置\n\n';
    code += 'const express = require("express");\n';
    code += 'const router = express.Router();\n\n';
    
    nodes.forEach(node => {
        const type = node.getAttribute('data-type');
        const title = node.querySelector('.node-header span').textContent;
        
        switch(type) {
            case 'endpoint':
                code += `// ${title}\n`;
                code += `router.${title.split(' ')[0].toLowerCase()}("/api/products", async (req, res) => {\n`;
                code += `  // 处理逻辑\n`;
                code += `  res.json({ success: true, data: [] });\n`;
                code += `});\n\n`;
                break;
            case 'auth':
                code += `// ${title}\n`;
                code += `const authenticateToken = (req, res, next) => {\n`;
                code += `  const token = req.headers.authorization?.split(" ")[1];\n`;
                code += `  if (!token) return res.status(401).json({ success: false });\n`;
                code += `  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {\n`;
                code += `    if (err) return res.status(403).json({ success: false });\n`;
                code += `    req.user = user;\n`;
                code += `    next();\n`;
                code += `  });\n`;
                code += `};\n\n`;
                break;
            case 'validator':
                code += `// ${title}\n`;
                code += `const validateRequest = (schema) => {\n`;
                code += `  return (req, res, next) => {\n`;
                code += `    const { error } = schema.validate(req.body);\n`;
                code += `    if (error) return res.status(400).json({ success: false, message: error.details[0].message });\n`;
                code += `    next();\n`;
                code += `  };\n`;
                code += `};\n\n`;
                break;
            case 'logger':
                code += `// ${title}\n`;
                code += `const requestLogger = (req, res, next) => {\n`;
                code += `  logger.info({\n`;
                code += `    method: req.method,\n`;
                code += `    url: req.url,\n`;
                code += `    timestamp: new Date().toISOString()\n`;
                code += `  });\n`;
                code += `  next();\n`;
                code += `};\n\n`;
                break;
        }
    });
    
    code += 'module.exports = router;';
    
    codePreview.innerHTML = `<pre><code>${escapeHtml(code)}</code></pre>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function validateConfiguration() {
    const validationResults = document.getElementById('validation-results');
    const nodes = document.querySelectorAll('.node');
    const results = [];
    
    if (nodes.length === 0) {
        results.push({
            type: 'error',
            message: '画布为空，请添加节点'
        });
    } else {
        results.push({
            type: 'success',
            message: `已添加 ${nodes.length} 个节点`
        });
        
        if (connections.length > 0) {
            results.push({
                type: 'success',
                message: `已建立 ${connections.length} 个连接`
            });
        } else {
            results.push({
                type: 'warning',
                message: '未建立任何连接'
            });
        }
        
        const hasEndpoint = Array.from(nodes).some(n => n.getAttribute('data-type') === 'endpoint');
        if (!hasEndpoint) {
            results.push({
                type: 'warning',
                message: '建议添加接口端点节点'
            });
        }
        
        const hasAuth = Array.from(nodes).some(n => n.getAttribute('data-type') === 'auth');
        if (!hasAuth) {
            results.push({
                type: 'warning',
                message: '建议添加认证中间件'
            });
        }
        
        const hasErrorHandler = Array.from(nodes).some(n => n.getAttribute('data-type') === 'error-handler');
        if (!hasErrorHandler) {
            results.push({
                type: 'warning',
                message: '建议添加错误处理节点'
            });
        }
    }
    
    validationResults.innerHTML = results.map(result => `
        <div class="validation-item ${result.type}">
            <i class="fas ${result.type === 'success' ? 'fa-check-circle' : result.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}"></i>
            <span>${result.message}</span>
        </div>
    `).join('');
}

function initializeModal() {
    const modal = document.getElementById('node-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const saveBtn = document.getElementById('modal-save');
    const cancelBtn = document.getElementById('modal-cancel');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    saveBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        showNotification('配置已保存', 'success');
    });
}

function initializeButtons() {
    document.getElementById('save-config').addEventListener('click', saveConfiguration);
    document.getElementById('preview-config').addEventListener('click', showPreview);
    document.getElementById('validate-config').addEventListener('click', validateConfiguration);
    document.getElementById('reset-config').addEventListener('click', resetConfiguration);
}

function saveConfiguration() {
    const config = {
        nodes: [],
        connections: connections
    };
    
    document.querySelectorAll('.node').forEach(node => {
        const nodeType = node.getAttribute('data-type');
        const nodeId = node.id;
        const position = {
            x: parseInt(node.style.left),
            y: parseInt(node.style.top)
        };
        
        config.nodes.push({
            id: nodeId,
            type: nodeType,
            position: position
        });
    });
    
    console.log('配置已保存:', config);
    showNotification('配置已保存到控制台', 'success');
}

function showPreview() {
    const code = document.getElementById('code-preview').textContent;
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>代码预览</title>
            <style>
                body { font-family: monospace; padding: 20px; background: #2c3e50; color: #ecf0f1; }
                pre { white-space: pre-wrap; }
            </style>
        </head>
        <body>
            <pre>${escapeHtml(code)}</pre>
        </body>
        </html>
    `);
    showNotification('预览窗口已打开', 'success');
}

function resetConfiguration() {
    if (confirm('确定要重置所有配置吗？此操作不可撤销。')) {
        const canvasContent = document.getElementById('canvas-content');
        canvasContent.innerHTML = '';
        
        jsPlumbInstance.reset();
        connections = [];
        selectedNode = null;
        nodeCounter = 4;
        
        document.getElementById('properties-form').innerHTML = '<p class="no-selection">请选择一个节点以编辑属性</p>';
        updateCodePreview();
        validateConfiguration();
        
        showNotification('配置已重置', 'success');
    }
}