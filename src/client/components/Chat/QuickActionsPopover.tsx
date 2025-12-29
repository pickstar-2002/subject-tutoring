import React, { useState, useEffect, useRef } from 'react'

interface QuickActionsPopoverProps {
  buttonRef: React.RefObject<HTMLButtonElement>
  onSelect: (question: string) => void
}

interface QuickQuestion {
  q: string
  icon: string
  category: string
}

export const QuickActionsPopover: React.FC<QuickActionsPopoverProps> = ({
  buttonRef,
  onSelect
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const popoverRef = useRef<HTMLDivElement>(null)

  // 快捷提问列表，按分类组织
  const quickQuestions: QuickQuestion[] = [
    { q: '什么是勾股定理？请用简单的话解释一下', icon: '📐', category: '数学' },
    { q: '如何理解函数的概念？', icon: '📈', category: '数学' },
    { q: '一元二次方程的求根公式是什么？', icon: '🔢', category: '数学' },
    { q: '牛顿第一定律是什么？能举个例子吗？', icon: '🍎', category: '物理' },
    { q: '什么是能量守恒定律？', icon: '⚡', category: '物理' },
    { q: '请给我出一道练习题', icon: '✏️', category: '练习' },
    { q: '帮我梳理一下今天的学习重点', icon: '📝', category: '复习' },
    { q: '这个知识点的常见误区有哪些？', icon: '⚠️', category: '提示' },
    { q: '给我讲一个相关的实际应用例子', icon: '💡', category: '应用' },
    { q: '用更简单的方式解释一遍', icon: '🎯', category: '理解' },
  ]

  // 计算弹出框位置
  useEffect(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const parentRect = buttonRef.current.closest('.bg-white')?.getBoundingClientRect()

      // 相对于父容器定位
      if (parentRect) {
        setPosition({
          top: rect.bottom - parentRect.top + 8,
          left: rect.right - parentRect.left - 280 // 让弹出框右对齐按钮
        })
      }
    }
  }, [buttonRef])

  // 分类
  const categories = Array.from(new Set(quickQuestions.map(q => q.category)))

  return (
    <div
      ref={popoverRef}
      className="quick-actions-popover absolute z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: '400px'
      }}
    >
      {/* 标题栏 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <span className="mr-2">⚡</span>
          快捷提问
        </h3>
      </div>

      {/* 问题列表 */}
      <div className="overflow-y-auto max-h-80 p-2">
        {categories.map((category) => (
          <div key={category} className="mb-3 last:mb-0">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {category}
            </div>
            {quickQuestions
              .filter(q => q.category === category)
              .map((item, index) => (
                <button
                  key={`${category}-${index}`}
                  onClick={() => onSelect(item.q)}
                  className="w-full text-left px-3 py-2 my-1 rounded-lg hover:bg-blue-50 transition group flex items-start space-x-2"
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <span className="text-sm text-gray-700 group-hover:text-blue-600 leading-snug">
                    {item.q}
                  </span>
                </button>
              ))}
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
        点击任意问题开始对话
      </div>
    </div>
  )
}

export default QuickActionsPopover
