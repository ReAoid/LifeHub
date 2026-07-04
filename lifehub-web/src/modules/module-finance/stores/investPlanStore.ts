import { create } from 'zustand'
import {
  InvestPlanItem,
  fetchInvestPlans,
  fetchInvestPlan,
  createInvestPlan,
  updateInvestPlan,
  deleteInvestPlan,
  checkDuePlans,
} from '../api/financeApi'

interface InvestPlanState {
  plans: InvestPlanItem[]
  currentPlan: InvestPlanItem | null
  duePlans: { plan_id: string; plan_name: string; amount: number; next_date: string }[]
  loading: boolean
  error: string | null

  loadPlans: (isActive?: boolean) => Promise<void>
  loadPlan: (planId: string) => Promise<void>
  addPlan: (data: { name: string; asset_id: string; amount: number; frequency?: string; next_date?: string }) => Promise<InvestPlanItem>
  editPlan: (planId: string, data: Partial<InvestPlanItem>) => Promise<void>
  removePlan: (planId: string) => Promise<void>
  checkDue: () => Promise<void>
  clearError: () => void
}

export const useInvestPlanStore = create<InvestPlanState>((set, get) => ({
  plans: [],
  currentPlan: null,
  duePlans: [],
  loading: false,
  error: null,

  loadPlans: async (isActive) => {
    set({ loading: true, error: null })
    try {
      const plans = await fetchInvestPlans(isActive)
      set({ plans, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  loadPlan: async (planId) => {
    set({ loading: true, error: null })
    try {
      const plan = await fetchInvestPlan(planId)
      set({ currentPlan: plan, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  addPlan: async (data) => {
    set({ error: null })
    try {
      const plan = await createInvestPlan(data)
      set((state) => ({ plans: [...state.plans, plan] }))
      return plan
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
      throw err
    }
  },

  editPlan: async (planId, data) => {
    set({ error: null })
    try {
      const updated = await updateInvestPlan(planId, data)
      set((state) => ({
        plans: state.plans.map((p) => (p.id === planId ? updated : p)),
        currentPlan: state.currentPlan?.id === planId ? updated : state.currentPlan,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removePlan: async (planId) => {
    set({ error: null })
    try {
      await deleteInvestPlan(planId)
      set((state) => ({
        plans: state.plans.filter((p) => p.id !== planId),
        currentPlan: state.currentPlan?.id === planId ? null : state.currentPlan,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  checkDue: async () => {
    set({ error: null })
    try {
      const duePlans = await checkDuePlans()
      set({ duePlans })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  clearError: () => set({ error: null }),
}))
