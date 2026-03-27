from functools import wraps
from flask import request, jsonify
import jwt
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 生成JWT令牌
def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role
    }
    token = jwt.encode(payload, os.getenv('SECRET_KEY', 'secret'), algorithm='HS256')
    return token

# 验证JWT令牌
def verify_token(token):
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY', 'secret'), algorithms=['HS256'])
        return payload
    except jwt.InvalidTokenError:
        return None

# 权限装饰器
def require_role(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 从请求头获取令牌
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': '缺少授权令牌'}), 401
            
            # 验证令牌
            payload = verify_token(token)
            if not payload:
                return jsonify({'error': '无效的授权令牌'}), 401
            
            # 检查角色权限
            user_role = payload.get('role')
            if user_role not in roles:
                return jsonify({'error': '权限不足'}), 403
            
            # 将用户信息传递给函数
            request.user = payload
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# 更新登录和注册路由，使用JWT令牌
def update_auth_routes(app, db):
    @app.route('/api/users/login', methods=['POST'])
    def login():
        # 获取登录数据
        login_data = request.json
        
        # 查找用户
        user = db.users.find_one({'username': login_data['username'], 'password': login_data['password']})
        if user:
            # 生成JWT令牌
            token = generate_token(str(user['_id']), user['role'])
            return jsonify({'message': '登录成功', 'role': user['role'], 'token': token})
        else:
            return jsonify({'error': '用户名或密码错误'}), 401
    
    @app.route('/api/users/register', methods=['POST'])
    def register():
        # 获取注册数据
        user_data = request.json
        
        # 检查用户是否已存在
        existing_user = db.users.find_one({'username': user_data['username']})
        if existing_user:
            return jsonify({'error': '用户名已存在'}), 400
        
        # 创建新用户
        user = {
            'username': user_data['username'],
            'password': user_data['password'],  # 实际应用中应该加密
            'role': user_data['role'],
            'preferences': user_data.get('preferences', {})
        }
        
        # 插入数据库
        result = db.users.insert_one(user)
        
        # 生成JWT令牌
        token = generate_token(str(result.inserted_id), user['role'])
        return jsonify({'message': '注册成功', 'user_id': str(result.inserted_id), 'token': token})

# 更新需要权限的路由
def update_protected_routes(app):
    # 示例：需要经销商权限的路由
    @app.route('/api/dealer/stats', methods=['GET'])
    @require_role(['经销商'])
    def get_dealer_stats():
        return jsonify({'message': '经销商统计数据'})
    
    # 示例：需要科研人员权限的路由
    @app.route('/api/research/data', methods=['GET'])
    @require_role(['科研人员'])
    def get_research_data():
        return jsonify({'message': '科研数据'})

# 更新前端的API调用，添加令牌认证
def update_frontend_api_calls():
    # 前端需要在请求头中添加Authorization: Bearer <token>
    pass