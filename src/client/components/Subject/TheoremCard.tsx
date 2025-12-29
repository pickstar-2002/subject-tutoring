import React from 'react'
import type { Theorem } from '@shared/types'
import { DIFFICULTY_COLORS } from '@shared/types'

interface TheoremCardProps {
  theorem: Theorem
  onClick?: () => void
}

export const TheoremCard: React.FC<TheoremCardProps> = ({ theorem, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition group"
    >
      {/* 头部 */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
            {theorem.theorem}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{theorem.topic}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[theorem.difficulty]}`}>
          {theorem.difficulty}
        </span>
      </div>

      {/* 描述 */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{theorem.description}</p>

      {/* 公式 */}
      {theorem.formula && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-4">
          <p className="text-center text-sm font-mono text-gray-700">{theorem.formula}</p>
        </div>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{theorem.subject}</span>
        <span>{theorem.proofSteps.length} 个证明步骤</span>
      </div>
    </div>
  )
}

export default TheoremCard
