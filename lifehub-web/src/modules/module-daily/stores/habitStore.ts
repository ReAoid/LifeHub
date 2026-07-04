import { create } from 'zustand'
import {
  HabitItem,
  HabitLogItem,
  HabitStreak,
  fetchHabits,
  fetchHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  fetchHabitStreak,
  fetchHabitLogs,
  logHabit,
  deleteHabitLog,
} from '../api/dailyApi'

interface HabitState {
  habits: HabitItem[]
  currentHabit: HabitItem | null
  habitLogs: HabitLogItem[]
  streak: HabitStreak | null
  loading: boolean
  error: string | null

  loadHabits: (isActive?: boolean) => Promise<void>
  loadHabit: (habitId: string) => Promise<void>
  addHabit: (data: { name: string; description?: string; frequency?: string; target_count?: number; icon?: string; color?: string }) => Promise<HabitItem>
  editHabit: (habitId: string, data: Partial<{ name: string; description: string; frequency: string; target_count: number; icon: string; color: string; is_active: boolean }>) => Promise<void>
  removeHabit: (habitId: string) => Promise<void>
  loadStreak: (habitId: string) => Promise<void>

  loadLogs: (params?: { habitId?: string; dateFrom?: string; dateTo?: string }) => Promise<void>
  checkIn: (data: { habit_id: string; log_date?: string; count?: number; note?: string }) => Promise<void>
  removeLog: (logId: string) => Promise<void>

  clearError: () => void
}

export const useHabitStore = create<HabitState>((set) => ({
  habits: [],
  currentHabit: null,
  habitLogs: [],
  streak: null,
  loading: false,
  error: null,

  loadHabits: async (isActive) => {
    set({ loading: true, error: null })
    try {
      const habits = await fetchHabits(isActive)
      set({ habits, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  loadHabit: async (habitId) => {
    set({ loading: true, error: null })
    try {
      const habit = await fetchHabit(habitId)
      set({ currentHabit: habit, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  addHabit: async (data) => {
    set({ error: null })
    try {
      const habit = await createHabit(data)
      set((state) => ({ habits: [habit, ...state.habits] }))
      return habit
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
      throw err
    }
  },

  editHabit: async (habitId, data) => {
    set({ error: null })
    try {
      const updated = await updateHabit(habitId, data)
      set((state) => ({
        habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
        currentHabit: state.currentHabit?.id === habitId ? updated : state.currentHabit,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removeHabit: async (habitId) => {
    set({ error: null })
    try {
      await deleteHabit(habitId)
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== habitId),
        currentHabit: state.currentHabit?.id === habitId ? null : state.currentHabit,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  loadStreak: async (habitId) => {
    try {
      const streak = await fetchHabitStreak(habitId)
      set({ streak })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  loadLogs: async (params) => {
    set({ loading: true, error: null })
    try {
      const logs = await fetchHabitLogs(params)
      set({ habitLogs: logs, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  checkIn: async (data) => {
    set({ error: null })
    try {
      const log = await logHabit(data)
      set((state) => ({
        habitLogs: [log, ...state.habitLogs.filter((l) => !(l.habit_id === data.habit_id && l.log_date === log.log_date))],
      }))
      // Refresh streak
      const streak = await fetchHabitStreak(data.habit_id)
      set({ streak })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removeLog: async (logId) => {
    set({ error: null })
    try {
      await deleteHabitLog(logId)
      set((state) => ({
        habitLogs: state.habitLogs.filter((l) => l.id !== logId),
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  clearError: () => set({ error: null }),
}))
