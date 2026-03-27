"""
Minimax API 使用示例
展示如何在当前环境中使用minimax模型
"""

from minimax_client import MinimaxClient

# ========== 全局配置 ==========
# Minimax API密钥
# 用户名: fc188022
API_KEY = "sk-api-7Hcu2j0rWnrI6M6lGC3LPvYrwJCzDZtDWZ87Ok-8JKTk27es6ASYVyv5dPYqNMn7GUY9nqv1Hggpf7A-n52JZYDJgw3yITHIuYy6YHjC-3wTJ-69UPdRlvQ"
GROUP_ID = None  # 可选，如果有Group ID请填写

def main():
    """主函数 - 使用示例"""
    
    # ========== 配置部分 ==========
    # 使用全局API_KEY
    
    # ========== 初始化客户端 ==========
    print("正在初始化Minimax客户端...")
    try:
        client = MinimaxClient(api_key=API_KEY, group_id=GROUP_ID)
        print("✅ 客户端初始化成功")
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        return
    
    # ========== 示例1：简单文本生成 ==========
    print("\n" + "="*50)
    print("示例1：简单文本生成")
    print("="*50)
    
    prompt = "请介绍一下2026年生物农药的发展趋势"
    print(f"提示词: {prompt}")
    
    try:
        result = client.generate_text(prompt)
        print(f"生成结果:\n{result}")
    except Exception as e:
        print(f"生成失败: {e}")
    
    # ========== 示例2：多轮对话 ==========
    print("\n" + "="*50)
    print("示例2：多轮对话")
    print("="*50)
    
    messages = [
        {"role": "system", "content": "你是一位农药行业专家，擅长分析农药市场动态。"},
        {"role": "user", "content": "请分析当前农药市场的主要趋势"},
        {"role": "assistant", "content": "当前农药市场呈现以下趋势：1. 生物农药快速发展 2. 绿色农业需求增长 3. 政策法规趋严..."},
        {"role": "user", "content": "生物农药有哪些主要类型？"}
    ]
    
    try:
        result = client.chat_completion(messages=messages)
        if "choices" in result:
            print(f"回复: {result['choices'][0]['message']['content']}")
        else:
            print(f"错误: {result.get('error', '未知错误')}")
    except Exception as e:
        print(f"对话失败: {e}")
    
    # ========== 示例3：文章分析 ==========
    print("\n" + "="*50)
    print("示例3：文章分析")
    print("="*50)
    
    sample_article = """
    2026年农药市场分析报告
    
    随着绿色农业的快速发展，生物农药在2026年迎来了爆发式增长。
    据统计，生物农药市场规模达到500亿元，同比增长35%。
    其中，微生物农药占比最大，达到60%，植物源农药占25%，生物化学农药占15%。
    
    政策方面，国家出台了《生物农药产业发展规划》，
    明确提出到2030年生物农药使用比例达到30%的目标。
    """
    
    try:
        analysis = client.analyze_article(sample_article)
        print(f"分析结果:\n{json.dumps(analysis, ensure_ascii=False, indent=2)}")
    except Exception as e:
        print(f"分析失败: {e}")
    
    # ========== 示例4：批量处理 ==========
    print("\n" + "="*50)
    print("示例4：批量处理文章")
    print("="*50)
    
    articles = [
        "文章1：关于农药残留检测的新技术...",
        "文章2：生物肥料与化学肥料的协同使用效果...",
        "文章3：2026年农药畅销品排行榜..."
    ]
    
    for i, article in enumerate(articles, 1):
        print(f"\n处理文章 {i}/{len(articles)}...")
        try:
            result = client.analyze_article(article)
            print(f"主题: {result.get('topic', 'unknown')}")
            print(f"评分: {result.get('score', 0)}/10")
        except Exception as e:
            print(f"处理失败: {e}")
    
    print("\n" + "="*50)
    print("所有示例执行完成")
    print("="*50)


if __name__ == "__main__":
    import json
    
    print("Minimax API 使用示例")
    print("="*50)
    print("注意：请先替换API密钥后再运行此脚本")
    print("获取API密钥：https://www.minimaxi.com/")
    print("="*50 + "\n")
    
    # 检查是否已配置API密钥
    if "sk-api-" in API_KEY:
        print("✅ API密钥已配置，开始测试")
        main()
    else:
        print("⚠️  警告：您尚未配置API密钥")
        print("请修改文件中的 API_KEY 变量，替换为您的实际API密钥")
        print("\n配置步骤：")
        print("1. 访问 https://www.minimaxi.com/ 注册账号")
        print("2. 在控制台获取API密钥")
        print("3. 修改本文件中的 API_KEY 变量")
        print("4. 重新运行此脚本")
