import requests
import json
import time
import re
from datetime import datetime
import os

# 导入Minimax客户端
import sys
import os

# 添加根目录到Python路径
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))
from minimax_client import MinimaxClient

# 初始化Minimax客户端
MINIMAX_API_KEY = "sk-api-7Hcu2j0rWnrI6M6lGC3LPvYrwJCzDZtDWZ87Ok-8JKTk27es6ASYVyv5dPYqNMn7GUY9nqv1Hggpf7A-n52JZYDJgw3yITHIuYy6YHjC-3wTJ-69UPdRlvQ"
minimax_client = MinimaxClient(api_key=MINIMAX_API_KEY)

# API配置
API_KEY = "JZL05e325094f052b92"
API_URL = "https://www.dajiala.com/fbmain/monitor/v3/kw_search"

# 分析关键词
KEYWORDS = {
    "ranking": ["排名", "畅销", "热销", "top", "销量", "市场份额"],
    "reviews": ["好评", "差评", "评价", "反馈", "效果", "口碑"],
    "synergy": ["协同", "增效", "配合", "混合", "肥料", "养分"],
    "technology": ["技术", "实践", "创新", "方法", "应用", "研究"]
}

def fetch_articles(keyword, page=1):
    """抓取公众号文章"""
    payload = {
        "kw": keyword,
        "sort_type": 1,  # 按阅读数排序
        "mode": 3,  # 搜索标题和正文
        "period": 7,  # 最近7天
        "page": page,
        "key": API_KEY,
        "any_kw": "",
        "ex_kw": ""
    }
    
    try:
        # 尝试禁用SSL验证（仅用于测试）
        response = requests.post(API_URL, json=payload, verify=False)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.SSLError as e:
        print(f"SSL连接错误: {e}")
        print("正在尝试禁用SSL验证...")
        try:
            response = requests.post(API_URL, json=payload, verify=False)
            response.raise_for_status()
            return response.json()
        except Exception as e2:
            print(f"禁用SSL验证后仍然失败: {e2}")
            return None
    except requests.exceptions.ConnectionError as e:
        print(f"网络连接错误: {e}")
        print("请检查网络连接是否正常")
        return None
    except requests.exceptions.Timeout as e:
        print(f"请求超时: {e}")
        return None
    except Exception as e:
        print(f"API调用失败: {e}")
        return None

def analyze_article(article):
    """分析文章内容"""
    content = article.get('content', '') + article.get('title', '')
    score = 0
    topics = {}
    
    # 增强的关键词列表
    enhanced_keywords = {
        "ranking": ["排名", "畅销", "热销", "top", "销量", "市场份额", "排行榜", "销售额", "市场占比"],
        "reviews": ["好评", "差评", "评价", "反馈", "效果", "口碑", "使用体验", "用户评价", "农户反馈"],
        "synergy": ["协同", "增效", "配合", "混合", "肥料", "养分", "互作", "组合使用", "搭配使用"],
        "technology": ["技术", "实践", "创新", "方法", "应用", "研究", "技术推广", "使用技术", "新方法"],
        "policy": ["政策", "法规", "条例", "规定", "管理办法", "监管", "禁用", "限用", "登记", "许可", "标准", "规范", "合规"],
        "bio_agriculture": ["生物农业", "生物农药", "生物防治", "生物肥料", "微生物", "生物制剂", "绿色农业", "生态农业", "有机农业", "生物育种", "基因工程", "生物刺激素", "生物菌剂"]
    }
    
    # 基础关键词匹配评分
    relevance_score = 0
    for topic, keywords in enhanced_keywords.items():
        matched = any(keyword in content for keyword in keywords)
        if matched:
            relevance_score += 10
            topics[topic] = True
        else:
            topics[topic] = False
    score += relevance_score
    
    # 内容质量评分
    content_score = 0
    if len(content) > 1000:
        content_score += 10
    if article.get('read', 0) > 1000:
        content_score += 10
    if article.get('praise', 0) > 50:
        content_score += 10
    score += content_score
    
    # 时效性评分
    publish_time = article.get('publish_time', 0)
    if publish_time:
        days_since_publish = (datetime.now().timestamp() - publish_time) / (24 * 3600)
        if days_since_publish <= 1:
            score += 20
        elif days_since_publish <= 3:
            score += 15
        elif days_since_publish <= 7:
            score += 10
    
    # 数据完整性评分
    if article.get('read') and article.get('praise'):
        score += 10
    
    # 使用Minimax增强分析
    minimax_analysis = None
    try:
        # 调用Minimax进行深度分析
        minimax_analysis = minimax_client.analyze_article(content)
        
        # 基于Minimax的分析结果调整评分
        if minimax_analysis and "score" in minimax_analysis:
            # 整合Minimax的评分
            minimax_score = minimax_analysis["score"] * 10  # 转换为0-100分
            # 权重分配：基础评分70%，Minimax评分30%
            score = int(score * 0.7 + minimax_score * 0.3)
        
        # 基于Minimax的主题分类优化
        if minimax_analysis and "analysis" in minimax_analysis:
            analysis_text = minimax_analysis["analysis"]
            # 根据Minimax的分析结果调整主题分类
            if "排名" in analysis_text or "畅销" in analysis_text:
                topics["ranking"] = True
            if "评价" in analysis_text or "反馈" in analysis_text:
                topics["reviews"] = True
            if "协同" in analysis_text or "增效" in analysis_text:
                topics["synergy"] = True
            if "技术" in analysis_text or "实践" in analysis_text:
                topics["technology"] = True
            if "政策" in analysis_text or "法规" in analysis_text:
                topics["policy"] = True
            if "生物" in analysis_text or "绿色" in analysis_text:
                topics["bio_agriculture"] = True
    except Exception as e:
        # 如果Minimax分析失败，使用基础分析结果
        pass
    
    return {
        "score": score,
        "topics": topics,
        "content_quality": content_score,
        "relevance": relevance_score,
        "minimax_analysis": minimax_analysis
    }

def generate_html_report(articles, analyzed_results):
    """生成HTML报告"""
    # 按评分排序
    sorted_articles = sorted(
        zip(articles, analyzed_results),
        key=lambda x: x[1]['score'],
        reverse=True
    )
    
    # 统计数据
    total_articles = len(articles)
    high_score_articles = [item for item in sorted_articles if item[1]['score'] >= 70]
    topic_stats = {topic: 0 for topic in ['ranking', 'reviews', 'synergy', 'technology', 'policy', 'bio_agriculture']}
    for _, result in sorted_articles:
        for topic, matched in result['topics'].items():
            if matched:
                topic_stats[topic] += 1
    
    # 按板块分类文章
    articles_by_topic = {
        'ranking': [],  # 农药畅销品排名
        'reviews': [],  # 农药产品评价
        'synergy': [],  # 农药协同增效
        'technology': [],  # 农药技术实践
        'policy': [],  # 农药政策法规
        'bio_agriculture': []  # 生物农业发展
    }
    
    for article, result in sorted_articles:
        for topic, matched in result['topics'].items():
            if matched:
                articles_by_topic[topic].append((article, result))
    
    # 生成HTML
    html = """
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>农药相关公众号文章分析报告</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Microsoft YaHei', Arial, sans-serif;
                background-color: #f5f5f5;
                color: #333;
                line-height: 1.6;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 0;
                text-align: center;
                border-radius: 10px;
                margin-bottom: 30px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            
            h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
            }
            
            .subtitle {
                font-size: 1.2rem;
                opacity: 0.9;
            }
            
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                text-align: center;
                transition: transform 0.3s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            
            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 1rem;
                color: #666;
            }
            
            .articles-section {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                margin-bottom: 30px;
            }
            
            h2 {
                color: #333;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #667eea;
            }
            
            .article-card {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 15px;
                transition: all 0.3s ease;
            }
            
            .article-card:hover {
                border-color: #667eea;
                box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            }
            
            .article-title {
                font-size: 1.2rem;
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
            }
            
            .article-meta {
                font-size: 0.9rem;
                color: #666;
                margin-bottom: 10px;
            }
            
            .article-score {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .article-topics {
                margin-top: 10px;
            }
            
            .topic-tag {
                display: inline-block;
                background: #f0f0f0;
                padding: 3px 10px;
                border-radius: 15px;
                font-size: 0.8rem;
                margin-right: 8px;
                margin-bottom: 8px;
            }
            
            .topic-tag.relevant {
                background: #e3f2fd;
                color: #1976d2;
            }
            
            .article-minimax-analysis {
                margin-top: 15px;
                padding: 10px;
                background-color: #f8f9fa;
                border-left: 4px solid #007bff;
                border-radius: 4px;
            }
            
            .article-minimax-analysis h4 {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 5px;
                color: #333;
            }
            
            .article-minimax-analysis p {
                font-size: 13px;
                line-height: 1.4;
                color: #666;
                margin: 0;
            }
            
            .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 0.9rem;
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 10px;
                }
                
                header {
                    padding: 30px 0;
                }
                
                h1 {
                    font-size: 2rem;
                }
                
                .stats {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>农药相关公众号文章分析报告</h1>
                <p class="subtitle">生成时间: """
    html += datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    html += """
</p>
            </header>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">"""
    html += str(total_articles)
    html += """
</div>
                    <div class="stat-label">总文章数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">"""
    html += str(len(high_score_articles))
    html += """
</div>
                    <div class="stat-label">高评分文章</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">"""
    html += str(topic_stats['ranking'])
    html += """
</div>
                    <div class="stat-label">畅销品排名</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">"""
    html += str(topic_stats['reviews'])
    html += """
</div>
                    <div class="stat-label">产品评价</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">"""
    html += str(topic_stats['synergy'])
    html += """
</div>
                    <div class="stat-label">协同增效</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">"""
    html += str(topic_stats['technology'])
    html += """
</div>
                    <div class="stat-label">技术实践</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">"""
    html += str(topic_stats['policy'])
    html += """
</div>
                    <div class="stat-label">政策法规</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">"""
    html += str(topic_stats['bio_agriculture'])
    html += """
</div>
                    <div class="stat-label">生物农业</div>
                </div>
            </div>
            
            <div class="articles-section">
                <h2>高评分文章</h2>
    """
    
    # 添加高评分文章
    for article, result in sorted_articles[:10]:  # 只显示前10篇
        publish_time = article.get('publish_time_str', '')
        wx_name = article.get('wx_name', '未知公众号')
        read_count = article.get('read', 0)
        praise_count = article.get('praise', 0)
        
        # 生成话题标签
        topic_tags = []
        for topic, matched in result['topics'].items():
            topic_name = {
                'ranking': '畅销品排名',
                'reviews': '产品评价',
                'synergy': '协同增效',
                'technology': '技术实践',
                'policy': '政策法规',
                'bio_agriculture': '生物农业'
            }[topic]
            if matched:
                topic_tags.append(f'<span class="topic-tag relevant">{topic_name}</span>')
            else:
                topic_tags.append(f'<span class="topic-tag">{topic_name}</span>')
        
        # 构建文章卡片HTML
        article_html = f"""
                <div class="article-card">
                    <div class="article-title"><a href="{article.get('url', '#')}" target="_blank">{article.get('title', '无标题')}</a></div>
                    <div class="article-meta">
                        公众号: {wx_name} | 发布时间: {publish_time} | 阅读: {read_count} | 点赞: {praise_count}
                    </div>
                    <div class="article-score">评分: {result['score']}/100</div>
                    <div class="article-topics">
                        {''.join(topic_tags)}
                    </div>
        """
        
        # 添加Minimax分析结果
        if result.get('minimax_analysis'):
            minimax_analysis = result['minimax_analysis']
            analysis_text = minimax_analysis.get('analysis', '无分析结果')[:300]
            article_html += f"""
                    <div class="article-minimax-analysis">
                        <h4>智能分析</h4>
                        <p>{analysis_text}...</p>
                    </div>
            """
        
        article_html += """
                </div>
        """
        
        html += article_html
    
    # 添加按板块分类的文章
    topic_names = {
        'ranking': '农药畅销品排名',
        'reviews': '农药产品评价',
        'synergy': '农药协同增效',
        'technology': '农药技术实践',
        'policy': '农药政策法规',
        'bio_agriculture': '生物农业发展'
    }
    
    for topic, articles_list in articles_by_topic.items():
        if articles_list:
            html += f"""
            <div class="articles-section">
                <h2>{topic_names[topic]}</h2>
            """
            
            for article, result in articles_list[:5]:  # 每个板块显示前5篇
                publish_time = article.get('publish_time_str', '')
                wx_name = article.get('wx_name', '未知公众号')
                read_count = article.get('read', 0)
                praise_count = article.get('praise', 0)
                
                html += f"""
                <div class="article-card">
                    <div class="article-title"><a href="{article.get('url', '#')}" target="_blank">{article.get('title', '无标题')}</a></div>
                    <div class="article-meta">
                        公众号: {wx_name} | 发布时间: {publish_time} | 阅读: {read_count} | 点赞: {praise_count}
                    </div>
                    <div class="article-score">评分: {result['score']}/100</div>
                </div>
                """
            
            html += f"""
            </div>
            """
    
    # 完成HTML
    html += f"""
            </div>
            
            <div class="footer">
                <p>报告由公众号文章抓取与分析工具生成 | 数据来源: 微信公众号</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html

def get_mock_data():
    """获取模拟数据"""
    return [
        {
            "title": "2026年农药畅销品排名出炉，这些产品销量领先",
            "url": "https://mp.weixin.qq.com/s?__biz=MzA4MzE4MjAzMg==&mid=2650691234&idx=1&sn=1234567890abcdef",
            "short_link": "https://mp.weixin.qq.com/s/123456",
            "content": "2026年农药市场竞争激烈，以下是畅销品排名：1. 草甘膦 2. 吡虫啉 3. 阿维菌素...",
            "avatar": "https://img.yzcdn.cn/vant/logo.png",
            "publish_time": 1711401600,
            "publish_time_str": "2026-03-26",
            "update_time": 1711401600,
            "update_time_str": "2026-03-26",
            "wx_name": "农药市场观察",
            "wx_id": "nongyaoshichang",
            "ghid": "gh_123456",
            "read": 5000,
            "praise": 200,
            "looking": 50,
            "ip_wording": "北京",
            "classify": "农业",
            "is_original": 1
        },
        {
            "title": "农药与肥料协同增效技术实践",
            "url": "https://mp.weixin.qq.com/s?__biz=MzA5MzE5MjA5Mw==&mid=2650691234&idx=1&sn=abcdef1234567890",
            "short_link": "https://mp.weixin.qq.com/s/654321",
            "content": "最新研究表明，农药与肥料合理搭配可以显著提高农作物产量...",
            "avatar": "https://img.yzcdn.cn/vant/logo.png",
            "publish_time": 1711315200,
            "publish_time_str": "2026-03-25",
            "update_time": 1711315200,
            "update_time_str": "2026-03-25",
            "wx_name": "农业技术推广",
            "wx_id": "nongyetech",
            "ghid": "gh_654321",
            "read": 3000,
            "praise": 150,
            "looking": 30,
            "ip_wording": "上海",
            "classify": "技术",
            "is_original": 1
        },
        {
            "title": "农户评价：这些农药效果最好",
            "url": "https://mp.weixin.qq.com/s?__biz=MzA6MzE6MjA6Mw==&mid=2650691234&idx=1&sn=9876543210fedcba",
            "short_link": "https://mp.weixin.qq.com/s/987654",
            "content": "通过对1000位农户的调查，我们收集了对各种农药的评价...",
            "avatar": "https://img.yzcdn.cn/vant/logo.png",
            "publish_time": 1711228800,
            "publish_time_str": "2026-03-24",
            "update_time": 1711228800,
            "update_time_str": "2026-03-24",
            "wx_name": "农户之声",
            "wx_id": "nonghuzhisheng",
            "ghid": "gh_789012",
            "read": 4000,
            "praise": 180,
            "looking": 40,
            "ip_wording": "广州",
            "classify": "评价",
            "is_original": 1
        }
    ]

def filter_articles(articles):
    """过滤文章，去掉招聘信息和不相关内容"""
    # 招聘相关关键词
    recruitment_keywords = ['招聘', '招贤', '招人', '岗位', '职位', '简历', '薪资', '待遇', '面试']
    
    # 农药相关关键词
    pesticide_keywords = ['农药', '杀螨剂', '除草剂', '杀虫剂', '杀菌剂', '肥料', '植保', '农业']
    
    filtered_articles = []
    for article in articles:
        title = article.get('title', '').lower()
        content = article.get('content', '').lower()
        
        # 检查是否包含招聘信息
        has_recruitment = any(keyword in title or keyword in content for keyword in recruitment_keywords)
        if has_recruitment:
            continue
        
        # 检查是否包含农药相关内容
        has_pesticide = any(keyword in title or keyword in content for keyword in pesticide_keywords)
        if not has_pesticide:
            continue
        
        filtered_articles.append(article)
    
    return filtered_articles

def main(keyword):
    """主函数"""
    print(f"正在抓取关键词 '{keyword}' 的公众号文章...")
    
    # 抓取文章
    articles = []
    use_mock_data = False
    
    try:
        for page in range(1, 3):  # 抓取前两页
            result = fetch_articles(keyword, page)
            if result and result.get('code') == 0:
                data = result.get('data', [])
                articles.extend(data)
                print(f"第{page}页: 抓取到{len(data)}篇文章")
                time.sleep(2)  # 避免API限制
            else:
                print(f"抓取第{page}页失败")
                break
    except Exception as e:
        print(f"抓取过程中发生错误: {e}")
    
    # 过滤文章
    if articles:
        filtered_articles = filter_articles(articles)
        print(f"过滤后剩余{len(filtered_articles)}篇文章")
        articles = filtered_articles
    
    if not articles:
        print("没有抓取到文章，使用模拟数据生成报告...")
        articles = get_mock_data()
        use_mock_data = True
    
    print(f"共{'模拟' if use_mock_data else ''}抓取到{len(articles)}篇文章")
    
    # 分析文章
    print("正在分析文章内容...")
    analyzed_results = []
    for article in articles:
        result = analyze_article(article)
        analyzed_results.append(result)
    
    # 生成报告
    print("正在生成HTML报告...")
    report_html = generate_html_report(articles, analyzed_results)
    
    # 保存报告
    report_path = f"wechat_article_report_{int(time.time())}.html"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_html)
    
    print(f"报告已生成: {report_path}")
    return report_path

if __name__ == "__main__":
    # 示例调用
    main("农药 畅销")
