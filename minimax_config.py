"""
Minimax模型参数配置
根据不同使用场景优化模型参数
"""

class MinimaxConfig:
    """Minimax模型配置"""
    
    # 基础配置
    BASE_CONFIG = {
        "api_key": "sk-api-7Hcu2j0rWnrI6M6lGC3LPvYrwJCzDZtDWZ87Ok-8JKTk27es6ASYVyv5dPYqNMn7GUY9nqv1Hggpf7A-n52JZYDJgw3yITHIuYy6YHjC-3wTJ-69UPdRlvQ",
        "base_url": "https://api.minimax.chat/v1"
    }
    
    # 不同场景的参数配置
    SCENARIOS = {
        "article_analysis": {
            "model": "abab6.5-chat",
            "temperature": 0.2,  # 低温度，提高分析准确性
            "max_tokens": 2000,
            "top_p": 0.9
        },
        "qa_system": {
            "model": "abab6.5-chat",
            "temperature": 0.3,  # 适中温度，平衡准确性和灵活性
            "max_tokens": 2000,
            "top_p": 0.9
        },
        "trend_analysis": {
            "model": "abab6.5-chat",
            "temperature": 0.2,  # 低温度，提高分析的专业性
            "max_tokens": 3000,
            "top_p": 0.85
        },
        "creative_content": {
            "model": "abab6-chat",
            "temperature": 0.7,  # 高温度，增加创造性
            "max_tokens": 1500,
            "top_p": 0.95
        },
        "technical_writing": {
            "model": "abab6.5-chat",
            "temperature": 0.1,  # 极低温度，确保准确性
            "max_tokens": 2500,
            "top_p": 0.8
        }
    }
    
    @classmethod
    def get_config(cls, scenario):
        """
        获取特定场景的配置
        
        Args:
            scenario: 场景名称
            
        Returns:
            配置字典
        """
        config = cls.BASE_CONFIG.copy()
        if scenario in cls.SCENARIOS:
            config.update(cls.SCENARIOS[scenario])
        return config
    
    @classmethod
    def list_scenarios(cls):
        """
        列出所有可用场景
        
        Returns:
            场景列表
        """
        return list(cls.SCENARIOS.keys())


# 使用示例
if __name__ == "__main__":
    print("Minimax模型参数配置")
    print("=" * 60)
    
    print("可用场景:")
    for scenario in MinimaxConfig.list_scenarios():
        config = MinimaxConfig.get_config(scenario)
        print(f"\n场景: {scenario}")
        print(f"  模型: {config.get('model')}")
        print(f"  温度: {config.get('temperature')}")
        print(f"  最大 tokens: {config.get('max_tokens')}")
        print(f"  Top P: {config.get('top_p')}")
    
    print("\n" + "=" * 60)
    print("配置说明:")
    print("- temperature: 控制生成内容的随机性，值越高越随机")
    print("- max_tokens: 控制生成内容的最大长度")
    print("- top_p: 控制词汇多样性，值越高越多样")
    print("\n建议:")
    print("- 分析类任务: 使用较低的temperature")
    print("- 创意类任务: 使用较高的temperature")
    print("- 专业内容: 使用abab6.5-chat模型")
