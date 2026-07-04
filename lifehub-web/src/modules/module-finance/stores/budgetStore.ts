import { create } from 'zustand'
import {
  BudgetItem,
  BudgetWithSpending,
  MonthlyBudgetOverview,
  fetchBudgets,
  fetchBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  fetchMonthlyOverview,
} from '../api/financeApi'

interface BudgetState {
  budgets: BudgetItem[] | BudgetWithSpending[]
  currentBudget: BudgetItem | BudgetWithSpending | null
  monthlyOverview: MonthlyBudgetOverview | null
  loading: boolean
  error: string | null

  loadBudgets: (params?: { period?: string; year?: number; month?: number; withSpending?: boolean }) => Promise<void>
  loadBudget: (budgetId: string, withSpending?: boolean) => Promise<void>
  addBudget: (data: { category: string; amount: number; period?: string; year: number; month?: number }) => Promise<BudgetItem>
  editBudget: (budgetId: string, data: Partial<BudgetItem>) => Promise<void>
  removeBudget: (budgetId: string) => Promise<void>
  loadMonthlyOverview: (year: number, month: number) => Promise<void>
  clearError: () => void
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  currentBudget: null,
  monthlyOverview: null,
  loading: false,
  error: null,

  loadBudgets: async (params) => {
    set({ loading: true, error: null })
    try {
      const budgets = await fetchBudgets(params)
      set({ budgets: budgets as BudgetItem[], loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  loadBudget: async (budgetId, withSpending) => {
    set({ loading: true, error: null })
    try {
      const budget = await fetchBudget(budgetId, withSpending)
      set({ currentBudget: budget as BudgetItem, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  addBudget: async (data) => {
    set({ error: null })
    try {
      const budget = await createBudget(data)
      set((state) => ({ budgets: [...state.budgets, budget] }))
      return budget
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
      throw err
    }
  },

  editBudget: async (budgetId, data) => {
    set({ error: null })
    try {
      const updated = await updateBudget(budgetId, data)
      set((state) => ({
        budgets: state.budgets.map((b) => (b.id === budgetId ? updated : b)),
        currentBudget: state.currentBudget?.id === budgetId ? updated : state.currentBudget,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removeBudget: async (budgetId) => {
    set({ error: null })
    try {
      await deleteBudget(budgetId)
      set((state) => ({
        budgets: state.budgets.filter((b) => b.id !== budgetId),
        currentBudget: state.currentBudget?.id === budgetId ? null : state.currentBudget,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  loadMonthlyOverview: async (year, month) => {
    set({ loading: true, error: null })
    try {
      const overview = await fetchMonthlyOverview(year, month)
      set({ monthlyOverview: overview, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
