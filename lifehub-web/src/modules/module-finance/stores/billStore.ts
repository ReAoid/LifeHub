import { create } from 'zustand'
import {
  BillItem,
  BillCreatePayload,
  PaginatedBills,
  BillSummary,
  fetchBills,
  fetchBill,
  createBill,
  updateBill,
  deleteBill,
  fetchBillCategories,
  fetchBillSummary,
} from '../api/financeApi'

interface BillState {
  bills: BillItem[]
  currentBill: BillItem | null
  total: number
  categories: string[]
  summary: BillSummary | null
  loading: boolean
  error: string | null

  loadBills: (params?: { accountId?: string; billType?: string; category?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number }) => Promise<void>
  loadBill: (billId: string) => Promise<void>
  addBill: (data: BillCreatePayload) => Promise<BillItem>
  editBill: (billId: string, data: Partial<BillCreatePayload>) => Promise<void>
  removeBill: (billId: string) => Promise<void>
  loadCategories: () => Promise<void>
  loadSummary: (dateFrom: string, dateTo: string) => Promise<void>
  clearError: () => void
}

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],
  currentBill: null,
  total: 0,
  categories: [],
  summary: null,
  loading: false,
  error: null,

  loadBills: async (params) => {
    set({ loading: true, error: null })
    try {
      const result = await fetchBills(params)
      set({ bills: result.items, total: result.total, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  loadBill: async (billId) => {
    set({ loading: true, error: null })
    try {
      const bill = await fetchBill(billId)
      set({ currentBill: bill, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  addBill: async (data) => {
    set({ error: null })
    try {
      const bill = await createBill(data)
      set((state) => ({ bills: [bill, ...state.bills], total: state.total + 1 }))
      return bill
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
      throw err
    }
  },

  editBill: async (billId, data) => {
    set({ error: null })
    try {
      const updated = await updateBill(billId, data)
      set((state) => ({
        bills: state.bills.map((b) => (b.id === billId ? updated : b)),
        currentBill: state.currentBill?.id === billId ? updated : state.currentBill,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removeBill: async (billId) => {
    set({ error: null })
    try {
      await deleteBill(billId)
      set((state) => ({
        bills: state.bills.filter((b) => b.id !== billId),
        total: state.total - 1,
        currentBill: state.currentBill?.id === billId ? null : state.currentBill,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  loadCategories: async () => {
    try {
      const categories = await fetchBillCategories()
      set({ categories })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  loadSummary: async (dateFrom, dateTo) => {
    set({ loading: true, error: null })
    try {
      const summary = await fetchBillSummary(dateFrom, dateTo)
      set({ summary, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
