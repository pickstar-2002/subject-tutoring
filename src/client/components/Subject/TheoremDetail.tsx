import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { Theorem } from '@shared/types'
import { DIFFICULTY_COLORS } from '@shared/types'
import 'katex/dist/katex.min.css'

interface TheoremDetailProps {
  theorem: Theorem
  onClose?: () => void
}

export const TheoremDetail: React.FC<TheoremDetailProps> = ({ theorem, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'proof' | 'examples' | 'mistakes'>('overview')

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{theorem.theorem}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white`}>
                {theorem.difficulty}
              </span>
            </div>
            <p className="text-blue-100">{theorem.topic} · {theorem.subject}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b flex">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          概览
        </TabButton>
        <TabButton active={activeTab === 'proof'} onClick={() => setActiveTab('proof')}>
          证明
        </TabButton>
        <TabButton active={activeTab === 'examples'} onClick={() => setActiveTab('examples')}>
          例题
        </TabButton>
        <TabButton active={activeTab === 'mistakes'} onClick={() => setActiveTab('mistakes')}>
          易错点
        </TabButton>
      </div>

      {/* 内容 */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab theorem={theorem} />}
        {activeTab === 'proof' && <ProofTab theorem={theorem} />}
        {activeTab === 'examples' && <ExamplesTab theorem={theorem} />}
        {activeTab === 'mistakes' && <MistakesTab theorem={theorem} />}
      </div>
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium transition ${
        active
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

const OverviewTab: React.FC<{ theorem: Theorem }> = ({ theorem }) => {
  return (
    <div className="space-y-6">
      {/* 描述 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">描述</h3>
        <p className="text-gray-600">{theorem.description}</p>
      </div>

      {/* 公式 */}
      {theorem.formula && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">公式</h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <p className="text-center text-lg font-mono">{theorem.formula}</p>
          </div>
        </div>
      )}

      {/* 前置知识 */}
      {theorem.prerequisites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">前置知识</h3>
          <div className="flex flex-wrap gap-2">
            {theorem.prerequisites.map((prereq, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
              >
                {prereq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 教学提示 */}
      {theorem.teachingTips.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">学习提示</h3>
          <ul className="space-y-2">
            {theorem.teachingTips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">💡</span>
                <span className="text-gray-600">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const ProofTab: React.FC<{ theorem: Theorem }> = ({ theorem }) => {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">证明步骤</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-3 py-1 bg-gray-200 rounded-lg disabled:opacity-50"
          >
            上一步
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(theorem.proofSteps.length - 1, currentStep + 1))}
            disabled={currentStep === theorem.proofSteps.length - 1}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            下一步
          </button>
        </div>
      </div>

      {/* 步骤进度 */}
      <div className="flex gap-2 mb-4">
        {theorem.proofSteps.map((step, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition ${
              index === currentStep
                ? 'bg-blue-500 text-white'
                : index < currentStep
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* 当前步骤内容 */}
      {theorem.proofSteps[currentStep] && (
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            步骤 {currentStep + 1}: {theorem.proofSteps[currentStep].title}
          </h4>
          <p className="text-gray-700">{theorem.proofSteps[currentStep].content}</p>
        </div>
      )}
    </div>
  )
}

const ExamplesTab: React.FC<{ theorem: Theorem }> = ({ theorem }) => {
  return (
    <div className="space-y-4">
      {theorem.examples.map((example, index) => (
        <div key={index} className="border rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-2">例题 {index + 1}</h4>
          <p className="text-gray-700 mb-3">{example.problem}</p>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 font-medium mb-1">解答：</p>
            <p className="text-gray-700">{example.solution}</p>
          </div>
          {example.steps && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-2">步骤：</p>
              <ol className="list-decimal list-inside space-y-1">
                {example.steps.map((step, i) => (
                  <li key={i} className="text-sm text-gray-600">{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const MistakesTab: React.FC<{ theorem: Theorem }> = ({ theorem }) => {
  return (
    <div className="space-y-4">
      {theorem.commonMistakes.map((mistake, index) => (
        <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div className="flex-1">
              <h4 className="font-semibold text-red-700 mb-1">常见错误 {index + 1}</h4>
              <p className="text-gray-700 mb-2">{mistake.mistake}</p>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-green-600">✓ 正确理解：</span>
                  {mistake.correction}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TheoremDetail
