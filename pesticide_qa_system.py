"""
农药行业智能问答系统
基于Minimax模型，为用户提供专业的农药使用和市场咨询
"""

from minimax_client import MinimaxClient
import json
import time

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
        
    def ask(self, question, context=None):
        """
        提问函数
        
        Args:
            question: 用户问题
            context: 上下文信息（可选）
            
        Returns:
            回答内容
        """
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": question}
        ]
        
        if context:
            messages.insert(1, {"role": "assistant", "content": context})
        
        try:
            result = self.client.chat_completion(
                messages=messages,
                model="abab6.5-chat",
                temperature=0.3,  # 降低随机性，提高准确性
                max_tokens=2000
            )
            
            if "choices" in result:
                return result["choices"][0]["message"]["content"]
            else:
                return f"错误: {result.get('error', '未知错误')}"
        except Exception as e:
            return f"系统错误: {str(e)}"
    
    def batch_ask(self, questions):
        """
        批量提问
        
        Args:
            questions: 问题列表
            
        Returns:
            回答列表
        """
        answers = []
        for i, question in enumerate(questions, 1):
            print(f"处理问题 {i}/{len(questions)}...")
            answer = self.ask(question)
            answers.append({
                "question": question,
                "answer": answer
            })
            time.sleep(1)  # 避免API调用过于频繁
        return answers
    
    def analyze_market_trends(self, time_range="2026年"):
        """
        分析农药市场趋势
        
        Args:
            time_range: 时间范围
            
        Returns:
            市场趋势分析
        """
        question = f"请分析{time_range}农药市场的主要趋势，包括：\n1. 市场规模和增长情况\n2. 主要产品类别和变化\n3. 政策影响\n4. 技术发展趋势\n5. 未来预测"
        
        return self.ask(question)
    
    def recommend_pesticide(self, crop, pest, region=None):
        """
        推荐农药产品
        
        Args:
            crop: 作物类型
            pest: 病虫害类型
            region: 地区（可选）
            
        Returns:
            农药推荐
        """
        question = f"请为{crop}上的{pest}推荐合适的农药产品，包括：\n1. 推荐的农药品种\n2. 使用方法和注意事项\n3. 安全性评估\n4. 替代方案（如有）"
        
        if region:
            question += f"\n5. {region}地区的特殊考虑"
        
        return self.ask(question)
    
    def get_policy_info(self, policy_type="最新政策"):
        """
        获取农药政策信息
        
        Args:
            policy_type: 政策类型
            
        Returns:
            政策信息
        """
        question = f"请介绍{policy_type}关于农药的相关规定，包括：\n1. 政策主要内容\n2. 对行业的影响\n3. 企业和农户需要注意的事项\n4. 实施时间和范围"
        
        return self.ask(question)


def main():
    """主函数"""
    print("农药行业智能问答系统")
    print("=" * 60)
    
    # 初始化系统
    api_key = "sk-api-7Hcu2j0rWnrI6M6lGC3LPvYrwJCzDZtDWZ87Ok-8JKTk27es6ASYVyv5dPYqNMn7GUY9nqv1Hggpf7A-n52JZYDJgw3yITHIuYy6YHjC-3wTJ-69UPdRlvQ"
    qa_system = PesticideQASystem(api_key=api_key)
    
    print("✅ 系统初始化成功")
    print("\n功能菜单:")
    print("1. 市场趋势分析")
    print("2. 农药产品推荐")
    print("3. 政策法规查询")
    print("4. 自由提问")
    print("5. 批量提问")
    print("0. 退出")
    
    while True:
        choice = input("\n请选择功能编号: ")
        
        if choice == "0":
            print("谢谢使用，再见！")
            break
        
        elif choice == "1":
            time_range = input("请输入时间范围（如：2026年，近一年等）: ")
            if not time_range:
                time_range = "2026年"
            print("\n正在分析市场趋势...")
            result = qa_system.analyze_market_trends(time_range)
            print("\n" + "=" * 60)
            print(f"{time_range}农药市场趋势分析")
            print("=" * 60)
            print(result)
            
        elif choice == "2":
            crop = input("请输入作物类型: ")
            pest = input("请输入病虫害类型: ")
            region = input("请输入地区（可选）: ")
            print("\n正在推荐农药产品...")
            result = qa_system.recommend_pesticide(crop, pest, region)
            print("\n" + "=" * 60)
            print(f"{crop}上{ pest}的农药推荐")
            print("=" * 60)
            print(result)
            
        elif choice == "3":
            policy_type = input("请输入政策类型（如：最新政策，登记管理等）: ")
            if not policy_type:
                policy_type = "最新政策"
            print("\n正在查询政策信息...")
            result = qa_system.get_policy_info(policy_type)
            print("\n" + "=" * 60)
            print(f"{policy_type}信息")
            print("=" * 60)
            print(result)
            
        elif choice == "4":
            question = input("请输入您的问题: ")
            print("\n正在回答问题...")
            result = qa_system.ask(question)
            print("\n" + "=" * 60)
            print(f"问题: {question}")
            print("回答:")
            print(result)
            
        elif choice == "5":
            print("请输入问题，每行一个，输入空行结束:")
            questions = []
            while True:
                q = input()
                if not q:
                    break
                questions.append(q)
            
            if questions:
                print("\n正在批量处理问题...")
                results = qa_system.batch_ask(questions)
                for i, item in enumerate(results, 1):
                    print(f"\n{'-' * 40}")
                    print(f"问题 {i}: {item['question']}")
                    print(f"回答: {item['answer']}")
            else:
                print("未输入问题")
        
        else:
            print("无效选择，请重新输入")


if __name__ == "__main__":
    main()
