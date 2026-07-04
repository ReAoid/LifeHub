import { create } from 'zustand'
import {
  GoalItem,
  fetchGoals,
  fetchGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
} from '../api/dailyApi'

interface GoalState {
  goals: GoalItem[]
  currentGoal: GoalItem | null
  loading: boolean
  error: string | null

  loadGoals: (params?: { status?: string; goalType?: string }) => Promise<void>
  loadGoal: (goalId: string) => Promise<void>
  addGoal: (data: { title: string; description?: string; goal_type?: string; target_value?: number; current_value?: number; unit?: string; start_date?: string; end_date?: string }) => Promise<GoalItem>
  editGoal: (goalId: string, data: Partial<{ title: string; description: string; goal_type: string; target_value: number; current_value: number; unit: string; status: string }>) => Promise<void>
  removeGoal: (goalId: string) => Promise<void>
  updateProgress: (goalId: string, currentValue: number) => Promise<void>

  clearError: () => void
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  currentGoal: null,
  loading: false,
  error: null,

  loadGoals: async (params) => {
    set({ loading: true, error: null })
    try {
      const goals = await fetchGoals(params)
      set({ goals, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  loadGoal: async (goalId) => {
    set({ loading: true, error: null })
    try {
      const goal = await fetchGoal(goalId)
      set({ currentGoal: goal, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  addGoal: async (data) => {
    set({ error: null })
    try {
      const goal = await createGoal(data)
      set((state) => ({ goals: [goal, ...state.goals] }))
      return goal
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
      throw err
    }
  },

  editGoal: async (goalId, data) => {
    set({ error: null })
    try {
      const updated = await updateGoal(goalId, data)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? updated : g)),
        currentGoal: state.currentGoal?.id === goalId ? updated : state.currentGoal,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removeGoal: async (goalId) => {
    set({ error: null })
    try {
      await deleteGoal(goalId)
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
        currentGoal: state.currentGoal?.id === goalId ? null : state.currentGoal,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  updateProgress: async (goalId, currentValue) => {
    set({ error: null })
    try {
      const updated = await updateGoalProgress(goalId, currentValue)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? updated : g)),
        currentGoal: state.currentGoal?.id === goalId ? updated : state.currentGoal,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  clearError: () => set({ error: null }),
}))
