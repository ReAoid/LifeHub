import { create } from 'zustand'
import {
  TaskItem,
  TaskCreatePayload,
  TaskUpdatePayload,
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from '../api/dailyApi'

interface TaskState {
  tasks: TaskItem[]
  currentTask: TaskItem | null
  loading: boolean
  error: string | null

  loadTasks: (params?: { status?: string; priority?: number; includeDone?: boolean }) => Promise<void>
  loadTask: (taskId: string) => Promise<void>
  addTask: (data: TaskCreatePayload) => Promise<TaskItem>
  editTask: (taskId: string, data: TaskUpdatePayload) => Promise<void>
  removeTask: (taskId: string) => Promise<void>
  reorder: (taskIds: string[]) => Promise<void>
  clearError: () => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,

  loadTasks: async (params) => {
    set({ loading: true, error: null })
    try {
      const tasks = await fetchTasks(params)
      set({ tasks, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  loadTask: async (taskId) => {
    set({ loading: true, error: null })
    try {
      const task = await fetchTask(taskId)
      set({ currentTask: task, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  addTask: async (data) => {
    set({ error: null })
    try {
      const task = await createTask(data)
      set((state) => ({ tasks: [task, ...state.tasks] }))
      return task
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
      throw err
    }
  },

  editTask: async (taskId, data) => {
    set({ error: null })
    try {
      const updated = await updateTask(taskId, data)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
        currentTask: state.currentTask?.id === taskId ? updated : state.currentTask,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removeTask: async (taskId) => {
    set({ error: null })
    try {
      await deleteTask(taskId)
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  reorder: async (taskIds) => {
    try {
      const tasks = await reorderTasks(taskIds)
      set({ tasks })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  clearError: () => set({ error: null }),
}))
