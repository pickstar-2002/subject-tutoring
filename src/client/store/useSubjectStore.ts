import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SubjectState, SubjectCategory, DifficultyLevel, Theorem } from '@shared/types'

interface SubjectStore extends SubjectState {
  setCurrentSubject: (subject: SubjectCategory | null) => void
  setCurrentTopic: (topic: string | null) => void
  setDifficulty: (difficulty: DifficultyLevel) => void
  setCurrentTheorem: (theorem: Theorem | null) => void
  updateProgress: (theoremId: string, mastered: boolean) => void
  incrementStreak: () => void
  resetProgress: () => void
}

const initialState: SubjectState = {
  currentSubject: null,
  currentTopic: null,
  difficulty: '初级',
  currentTheorem: null,
  learningProgress: {
    totalTheorems: 0,
    learnedTheorems: 0,
    masteredTheorems: 0,
    currentStreak: 0,
    lastStudyTime: 0
  }
}

export const useSubjectStore = create<SubjectStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentSubject: (subject) =>
        set((state) => ({
          currentSubject: subject,
          currentTopic: null,
          currentTheorem: null
        })),

      setCurrentTopic: (topic) =>
        set({ currentTopic: topic }),

      setDifficulty: (difficulty) =>
        set({ difficulty }),

      setCurrentTheorem: (theorem) =>
        set({ currentTheorem: theorem }),

      updateProgress: (theoremId, mastered) =>
        set((state) => {
          const progress = { ...state.learningProgress }
          if (mastered) {
            progress.masteredTheorems += 1
          }
          return { learningProgress: progress }
        }),

      incrementStreak: () =>
        set((state) => {
          const progress = { ...state.learningProgress }
          progress.currentStreak += 1
          progress.lastStudyTime = Date.now()
          return { learningProgress: progress }
        }),

      resetProgress: () =>
        set({
          learningProgress: initialState.learningProgress
        })
    }),
    {
      name: 'subject-storage'
    }
  )
)
