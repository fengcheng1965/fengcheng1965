"""
测试公众号文章抓取工具的集成效果
"""

import sys
import os

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入scraper模块
import sys
import os

# 直接导入scraper模块
sys.path.append(os.path.join(os.path.dirname(__file__), '.trae', 'skills', 'wechat-article-scraper'))
from scraper import (
    fetch_articles, 
    analyze_article, 
    generate_html_report,
    filter_articles,
    get_mock_data
)

def test_scraper():
    """测试公众号文章抓取工具"""
    print("测试公众号文章抓取工具")
    print("=" * 60)
    
    # 测试参数
    keyword = "农药畅销品"
    period = 7  # 最近7天
    
    print(f"正在抓取关键词: {keyword}")
    print(f"时间范围: 最近{period}天")
    print("\n" + "-" * 60)
    
    # 1. 抓取文章
    print("1. 抓取文章...")
    # 直接使用模拟数据测试
    articles = get_mock_data()
    print(f"✅ 使用模拟数据，共 {len(articles)} 篇文章")
    
    # 2. 过滤文章
    print("\n2. 过滤文章...")
    filtered_articles = filter_articles(articles)
    print(f"✅ 过滤后剩余 {len(filtered_articles)} 篇文章")
    
    # 3. 分析文章
    print("\n3. 分析文章...")
    analyzed_results = []
    for article in filtered_articles:
        result = analyze_article(article)
        analyzed_results.append(result)
    print(f"✅ 分析完成，共分析 {len(analyzed_results)} 篇文章")
    
    # 4. 生成报告
    print("\n4. 生成HTML报告...")
    report_path = generate_html_report(filtered_articles, analyzed_results)
    print(f"✅ 报告已生成: {report_path}")
    
    # 5. 显示分析结果
    print("\n5. 分析结果摘要:")
    print("-" * 60)
    
    # 显示前3篇文章的分析结果
    for i, (article, result) in enumerate(zip(filtered_articles, analyzed_results), 1):
        if i > 3:
            break
        
        print(f"\n文章 {i}: {article.get('title', '无标题')}")
        print(f"  公众号: {article.get('wx_name', '未知')}")
        print(f"  评分: {result['score']}/100")
        print(f"  主题: {[k for k, v in result['topics'].items() if v]}")
        
        # 显示Minimax分析结果
        if result.get('minimax_analysis'):
            print("  智能分析: 已完成")
        else:
            print("  智能分析: 未完成")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    print(f"请打开 {report_path} 查看完整报告")


if __name__ == "__main__":
    test_scraper()
