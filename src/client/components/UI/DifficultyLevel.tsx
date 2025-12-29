import React from 'react'
import { useSubjectStore } from '../../store'
import { DIFFICULTY_LEVELS, DIFFICULTY_CONFIG } from '@shared/constants'
import type { DifficultyLevel } from '@shared/types'

export const DifficultyLevel: React.FC = () => {
  const { difficulty, setDifficulty } = useSubjectStore()

  return (
    <div className="flex gap-3">
      {DIFFICULTY_LEVELS.map((level) => {
        const config = DIFFICULTY_CONFIG[level]
        const isActive = difficulty === level

        return (
          <button
            key={level}
            onClick={() => setDifficulty(level as DifficultyLevel)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              isActive
                ? `bg-${config.color}-500 text-white`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {level}
          </button>
        )
      })}
    </div>
  )
}

export default DifficultyLevel
