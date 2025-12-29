import React, { useEffect, useState } from 'react'
import { useSubjectStore } from '../../store'
import { knowledgeService } from '../../services'

export const TopicSelector: React.FC = () => {
  const { currentSubject, currentTopic, setCurrentTopic } = useSubjectStore()
  const [topics, setTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentSubject) {
      setLoading(true)
      knowledgeService.getTopicsByCategory(currentSubject).then((data) => {
        setTopics(data)
        setLoading(false)
      })
    } else {
      setTopics([])
      setCurrentTopic(null)
    }
  }, [currentSubject])

  if (!currentSubject) {
    return <p className="text-sm text-gray-400">请先选择学科</p>
  }

  if (loading) {
    return <p className="text-sm text-gray-400">加载中...</p>
  }

  if (topics.length === 0) {
    return <p className="text-sm text-gray-400">该学科暂无主题</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCurrentTopic(null)}
        className={`px-3 py-1 rounded-lg text-sm transition ${
          currentTopic === null
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        全部
      </button>
      {topics.map((topic) => (
        <button
          key={topic}
          onClick={() => setCurrentTopic(topic)}
          className={`px-3 py-1 rounded-lg text-sm transition ${
            currentTopic === topic
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {topic}
        </button>
      ))}
    </div>
  )
}

export default TopicSelector
