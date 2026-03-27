"""
测试农药行业智能问答系统
"""

from minimax_client import MinimaxClient

class PesticideQASystem:
    """农药行业智能问答系统"""
    
    def __init__(self, api_key):
        """
        初始化问答系统
        
        Args:
            api_key: Minimax API密钥
        """
        self.client = MinimaxClient(api_key=api_key)
        self.system_prompt = """
你是一位专业的农药行业专家，拥有丰富的农药知识和行业经验。请针对用户的问题，提供专业、准确、详细的回答。

你的专业领域包括：
1. 农药产品知识（种类、特性、使用方法等）
2. 农药市场动态（价格、趋势、竞争格局等）
3. 农药使用技术（用量、时机、注意事项等）
4. 农药政策法规（登记、管理、禁用限用等）
5. 生物农药和绿色农业
6. 病虫害防治技术

请回答时注意以下要求：
- 专业性：基于专业知识和最新信息
- 准确性：确保信息正确无误
- 实用性：提供可操作的建议
- 全面性：覆盖问题的各个方面
- 清晰性：逻辑清晰，层次分明

如果遇到不确定的问题，请明确说明，并建议用户咨询专业机构。
        """
        
    def ask(self, question):
        """
        提问函数
        
        Args:
            question: 用户问题
            
        Returns:
            回答内容
        """
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": question}
        ]
        
        try:
            result = self.client.chat_completion(
                messages=messages,
                model="abab6.5-chat",
                temperature=0.3,
                max_tokens=1000
            )
            
            if "choices" in result:
                return result["choices"][0]["message"]["content"]
            else:
                return f"错误: {result.get('error', '未知错误')}"
        except Exception as e:
            return f"系统错误: {str(e)}"


def main():
    """主函数"""
    print("测试农药行业智能问答系统")
    print("=" * 60)
    
    # 初始化系统
    api_key = "sk-api-7Hcu2j0rWnrI6M6lGC3LPvYrwJCzDZtDWZ87Ok-8JKTk27es6ASYVyv5dPYqNMn7GUY9nqv1Hggpf7A-n52JZYDJgw3yITHIuYy6YHjC-3wTJ-69UPdRlvQ"
    qa_system = PesticideQASystem(api_key=api_key)
    
    print("✅ 系统初始化成功")
    
    # 测试问题
    test_questions = [
        "2026年生物农药的发展趋势是什么？",
        "如何防治水稻稻飞虱？",
        "最新的农药登记政策有哪些变化？"
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n测试问题 {i}: {question}")
        print("正在生成回答...")
        answer = qa_system.ask(question)
        print("回答:")
        print(answer)
        print("-" * 60)


if __name__ == "__main__":
    main()
