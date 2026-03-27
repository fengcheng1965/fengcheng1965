from flask import Flask, jsonify, request
import os

# 初始化Flask应用
app = Flask(__name__)

# 模拟数据库
db = {
    'products': [
        {
            '产品ID': 'AC001',
            '名称': '阿维菌素',
            '有效成分': '阿维菌素',
            '含量': '1.8%',
            '登记号': 'PD20180001',
            '生产企业': 'XX农药有限公司',
            '防治对象': '红蜘蛛',
            '适用作物': '柑橘、苹果、棉花',
            '使用方法': '稀释1000-1500倍液喷雾',
            '毒性': '低毒',
            '价格': 25.0,
            '市场份额': 15.2,
            '地区分布': {'华东': 30, '华南': 25, '华北': 20, '西南': 15, '东北': 10},
            '评价': []
        },
        {
            '产品ID': 'AC002',
            '名称': '螺螨酯',
            '有效成分': '螺螨酯',
            '含量': '24%',
            '登记号': 'PD20190002',
            '生产企业': 'YY农药有限公司',
            '防治对象': '红蜘蛛、白蜘蛛',
            '适用作物': '柑橘、苹果、葡萄',
            '使用方法': '稀释2000-3000倍液喷雾',
            '毒性': '低毒',
            '价格': 45.0,
            '市场份额': 12.8,
            '地区分布': {'华东': 25, '华南': 30, '华北': 15, '西南': 20, '东北': 10},
            '评价': []
        },
        {
            '产品ID': 'AC003',
            '名称': '乙螨唑',
            '有效成分': '乙螨唑',
            '含量': '10%',
            '登记号': 'PD20200003',
            '生产企业': 'ZZ农药有限公司',
            '防治对象': '红蜘蛛',
            '适用作物': '柑橘、苹果、棉花',
            '使用方法': '稀释1500-2000倍液喷雾',
            '毒性': '低毒',
            '价格': 35.0,
            '市场份额': 10.5,
            '地区分布': {'华东': 20, '华南': 25, '华北': 25, '西南': 15, '东北': 15},
            '评价': []
        },
        {
            '产品ID': 'AC004',
            '名称': '哒螨灵',
            '有效成分': '哒螨灵',
            '含量': '15%',
            '登记号': 'PD20170004',
            '生产企业': 'AA农药有限公司',
            '防治对象': '红蜘蛛、黄蜘蛛',
            '适用作物': '柑橘、苹果、蔬菜',
            '使用方法': '稀释1000-1500倍液喷雾',
            '毒性': '中等毒',
            '价格': 20.0,
            '市场份额': 8.7,
            '地区分布': {'华东': 35, '华南': 20, '华北': 20, '西南': 15, '东北': 10},
            '评价': []
        },
        {
            '产品ID': 'AC005',
            '名称': '联苯肼酯',
            '有效成分': '联苯肼酯',
            '含量': '24%',
            '登记号': 'PD20210005',
            '生产企业': 'BB农药有限公司',
            '防治对象': '红蜘蛛',
            '适用作物': '柑橘、苹果、葡萄',
            '使用方法': '稀释2000-2500倍液喷雾',
            '毒性': '低毒',
            '价格': 50.0,
            '市场份额': 7.3,
            '地区分布': {'华东': 25, '华南': 30, '华北': 15, '西南': 20, '东北': 10},
            '评价': []
        }
    ],
    'users': [
        {
            '用户名': 'nonghu1',
            '密码': '123456',
            '角色': '农户',
            '注册信息': {'姓名': '张三', '电话': '13800138000', '地区': '山东'},
            '偏好设置': {'作物': '苹果', '关注价格': True},
            '浏览历史': []
        },
        {
            '用户名': 'jingxiaoshang1',
            '密码': '123456',
            '角色': '经销商',
            '注册信息': {'姓名': '李四', '电话': '13900139000', '地区': '江苏'},
            '偏好设置': {'关注市场趋势': True, '关注竞争对手': True},
            '浏览历史': []
        },
        {
            '用户名': 'keyan1',
            '密码': '123456',
            '角色': '科研人员',
            '注册信息': {'姓名': '王五', '电话': '13700137000', '单位': '农业科学院'},
            '偏好设置': {'关注新成分': True, '关注研究趋势': True},
            '浏览历史': []
        }
    ],
    'market_data': [
        {'日期': '2026-01-01', '产品ID': 'AC001', '价格': 25.0, '销量': 1000, '地区': '全国'},
        {'日期': '2026-01-01', '产品ID': 'AC002', '价格': 45.0, '销量': 800, '地区': '全国'},
        {'日期': '2026-01-01', '产品ID': 'AC003', '价格': 35.0, '销量': 900, '地区': '全国'},
        {'日期': '2026-02-01', '产品ID': 'AC001', '价格': 25.5, '销量': 1100, '地区': '全国'},
        {'日期': '2026-02-01', '产品ID': 'AC002', '价格': 44.5, '销量': 850, '地区': '全国'},
        {'日期': '2026-02-01', '产品ID': 'AC003', '价格': 35.0, '销量': 950, '地区': '全国'}
    ]
}

# 简单的CORS中间件
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# 模拟用户认证
def verify_user(username, password):
    for user in db['users']:
        if user['用户名'] == username and user['密码'] == password:
            return user
    return None

# 健康检查路由
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

# 产品相关路由
@app.route('/api/products', methods=['GET'])
def get_products():
    # 从模拟数据库获取产品列表
    return jsonify(db['products'])

# 搜索产品路由
@app.route('/api/products/search', methods=['POST'])
def search_products():
    # 获取搜索条件
    search_data = request.json
    
    # 执行搜索
    results = []
    for product in db['products']:
        match = True
        if search_data.get('crop'):
            if search_data['crop'] not in product['适用作物']:
                match = False
        if search_data.get('mite'):
            if search_data['mite'] not in product['防治对象']:
                match = False
        if search_data.get('ingredient'):
            if search_data['ingredient'] not in product['有效成分']:
                match = False
        if match:
            results.append(product)
    
    return jsonify(results)

# 产品详情路由
@app.route('/api/products/<product_id>', methods=['GET'])
def get_product_detail(product_id):
    # 从模拟数据库获取产品详情
    for product in db['products']:
        if product['产品ID'] == product_id:
            return jsonify(product)
    return jsonify({'error': '产品不存在'}), 404

# 用户注册路由
@app.route('/api/users/register', methods=['POST'])
def register():
    # 获取注册数据
    user_data = request.json
    
    # 检查用户是否已存在
    for user in db['users']:
        if user['用户名'] == user_data['username']:
            return jsonify({'error': '用户名已存在'}), 400
    
    # 创建新用户
    user = {
        '用户名': user_data['username'],
        '密码': user_data['password'],
        '角色': user_data['role'],
        '注册信息': {},
        '偏好设置': {},
        '浏览历史': []
    }
    
    # 添加到数据库
    db['users'].append(user)
    return jsonify({'message': '注册成功', 'user_id': len(db['users']) - 1})

# 用户登录路由
@app.route('/api/users/login', methods=['POST'])
def login():
    # 获取登录数据
    login_data = request.json
    
    # 验证用户
    user = verify_user(login_data['username'], login_data['password'])
    if user:
        return jsonify({'message': '登录成功', 'role': user['角色']})
    else:
        return jsonify({'error': '用户名或密码错误'}), 401

# 数据统计路由
@app.route('/api/stats', methods=['GET'])
def get_stats():
    # 计算产品数量
    product_count = len(db['products'])
    
    # 计算按有效成分分布
    ingredient_distribution = {}
    for product in db['products']:
        ingredient = product['有效成分']
        if ingredient in ingredient_distribution:
            ingredient_distribution[ingredient] += 1
        else:
            ingredient_distribution[ingredient] = 1
    ingredient_distribution = [{'_id': k, 'count': v} for k, v in ingredient_distribution.items()]
    
    # 计算按价格分布
    price_distribution = {
        '0-20': 0,
        '20-30': 0,
        '30-40': 0,
        '40-50': 0,
        '50-100': 0,
        '>100': 0
    }
    for product in db['products']:
        price = product['价格']
        if price < 20:
            price_distribution['0-20'] += 1
        elif price < 30:
            price_distribution['20-30'] += 1
        elif price < 40:
            price_distribution['30-40'] += 1
        elif price < 50:
            price_distribution['40-50'] += 1
        elif price < 100:
            price_distribution['50-100'] += 1
        else:
            price_distribution['>100'] += 1
    price_distribution = [{'_id': k, 'count': v} for k, v in price_distribution.items()]
    
    # 计算按防治对象分布
    target_distribution = {}
    for product in db['products']:
        targets = product['防治对象'].split('、')
        for target in targets:
            if target in target_distribution:
                target_distribution[target] += 1
            else:
                target_distribution[target] = 1
    target_distribution = [{'_id': k, 'count': v} for k, v in target_distribution.items()]
    
    # 计算按适用作物分布
    crop_distribution = {}
    for product in db['products']:
        crops = product['适用作物'].split('、')
        for crop in crops:
            if crop in crop_distribution:
                crop_distribution[crop] += 1
            else:
                crop_distribution[crop] = 1
    crop_distribution = [{'_id': k, 'count': v} for k, v in crop_distribution.items()]
    
    # 获取市场趋势数据
    market_trend = db['market_data']
    
    return jsonify({
        'product_count': product_count,
        'ingredient_distribution': ingredient_distribution,
        'price_distribution': price_distribution,
        'target_distribution': target_distribution,
        'crop_distribution': crop_distribution,
        'market_trend': market_trend
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)