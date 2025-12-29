import React from 'react'

interface QuickActionsProps {
  onQuestionSelect: (question: string) => void
  messageCount: number
  learningStreak: number
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onQuestionSelect,
  messageCount,
  learningStreak
}) => {
  // 快捷提问列表
  const quickQuestions = [
    { q: '什么是勾股定理？请用简单的话解释一下', icon: '📐' },
    { q: '如何理解函数的概念？', icon: '📈' },
    { q: '牛顿第一定律是什么？能举个例子吗？', icon: '🍎' },
    { q: '什么是能量守恒定律？', icon: '⚡' },
    { q: '请给我出一道练习题', icon: '✏️' },
    { q: '帮我梳理一下今天的学习重点', icon: '📝' },
    { q: '这个知识点的常见误区有哪些？', icon: '⚠️' },
    { q: '给我讲一个相关的实际应用例子', icon: '💡' },
    { q: '用更简单的方式解释一遍', icon: '🎯' },
    { q: '一元二次方程的求根公式是什么？', icon: '🔢' },
  ]

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
      {/* 标题 */}
      <div className="flex items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-800">⚡ 快捷提问</h3>
      </div>

      {/* 快捷问题网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {quickQuestions.map((item, index) => (
          <button
            key={index}
            onClick={() => onQuestionSelect(item.q)}
            className="text-left p-3 bg-white rounded-lg hover:shadow-md transition group"
          >
            <div className="flex items-start space-x-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm text-gray-700 group-hover:text-blue-600 transition">
                {item.q}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 学习统计小条 */}
      <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>💬 {messageCount} 条对话</span>
          <span>🔥 连续学习 {learningStreak} 次</span>
        </div>
      </div>
    </div>
  )
}

export default QuickActions
