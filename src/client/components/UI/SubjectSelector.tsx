import React from 'react'
import { useSubjectStore } from '../../store'
import { SUBJECT_CONFIG } from '@shared/constants'
import type { SubjectCategory } from '@shared/types'

export const SubjectSelector: React.FC = () => {
  const { currentSubject, setCurrentSubject } = useSubjectStore()

  return (
    <div className="flex flex-wrap gap-3">
      {(Object.keys(SUBJECT_CONFIG) as SubjectCategory[]).map((category) => {
        const config = SUBJECT_CONFIG[category]
        const isActive = currentSubject === category

        return (
          <button
            key={category}
            onClick={() => setCurrentSubject(isActive ? null : category)}
            className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
              isActive
                ? `bg-${config.color}-500 text-white shadow-lg`
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span className="text-xl">{config.icon}</span>
            <span>{config.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export default SubjectSelector
