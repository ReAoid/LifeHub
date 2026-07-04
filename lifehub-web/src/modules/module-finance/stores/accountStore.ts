import { create } from 'zustand'
import {
  AccountItem,
  fetchAccounts,
  fetchAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  adjustBalance,
} from '../api/financeApi'

interface AccountState {
  accounts: AccountItem[]
  currentAccount: AccountItem | null
  loading: boolean
  error: string | null

  loadAccounts: (isActive?: boolean) => Promise<void>
  loadAccount: (accountId: string) => Promise<void>
  addAccount: (data: { name: string; account_type?: string; currency?: string; balance?: number; icon?: string; color?: string }) => Promise<AccountItem>
  editAccount: (accountId: string, data: Partial<AccountItem>) => Promise<void>
  removeAccount: (accountId: string) => Promise<void>
  adjustBal: (accountId: string, amount: number) => Promise<void>
  clearError: () => void
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  currentAccount: null,
  loading: false,
  error: null,

  loadAccounts: async (isActive) => {
    set({ loading: true, error: null })
    try {
      const accounts = await fetchAccounts(isActive)
      set({ accounts, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  loadAccount: async (accountId) => {
    set({ loading: true, error: null })
    try {
      const account = await fetchAccount(accountId)
      set({ currentAccount: account, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  addAccount: async (data) => {
    set({ error: null })
    try {
      const account = await createAccount(data)
      set((state) => ({ accounts: [...state.accounts, account] }))
      return account
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
      throw err
    }
  },

  editAccount: async (accountId, data) => {
    set({ error: null })
    try {
      const updated = await updateAccount(accountId, data)
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === accountId ? updated : a)),
        currentAccount: state.currentAccount?.id === accountId ? updated : state.currentAccount,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removeAccount: async (accountId) => {
    set({ error: null })
    try {
      await deleteAccount(accountId)
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== accountId),
        currentAccount: state.currentAccount?.id === accountId ? null : state.currentAccount,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  adjustBal: async (accountId, amount) => {
    set({ error: null })
    try {
      const updated = await adjustBalance(accountId, amount)
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === accountId ? updated : a)),
        currentAccount: state.currentAccount?.id === accountId ? updated : state.currentAccount,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  clearError: () => set({ error: null }),
}))
