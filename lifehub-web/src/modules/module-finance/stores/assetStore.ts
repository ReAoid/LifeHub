import { create } from 'zustand'
import {
  AssetItem,
  AssetWithProfit,
  PortfolioSummary,
  fetchAssets,
  fetchAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  updateAssetPrice,
  fetchPortfolioSummary,
} from '../api/financeApi'

interface AssetState {
  assets: AssetItem[] | AssetWithProfit[]
  currentAsset: AssetItem | AssetWithProfit | null
  portfolioSummary: PortfolioSummary | null
  loading: boolean
  error: string | null

  loadAssets: (params?: { assetType?: string; withProfit?: boolean }) => Promise<void>
  loadAsset: (assetId: string, withProfit?: boolean) => Promise<void>
  addAsset: (data: { name: string; asset_type: string; code?: string; hold_amount?: number; cost_price?: number; current_price?: number; currency?: string; purchase_date?: string }) => Promise<AssetItem>
  editAsset: (assetId: string, data: Partial<AssetItem>) => Promise<void>
  removeAsset: (assetId: string) => Promise<void>
  updatePrice: (assetId: string, currentPrice: number) => Promise<void>
  loadPortfolioSummary: () => Promise<void>
  clearError: () => void
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  currentAsset: null,
  portfolioSummary: null,
  loading: false,
  error: null,

  loadAssets: async (params) => {
    set({ loading: true, error: null })
    try {
      const assets = await fetchAssets(params)
      set({ assets: assets as AssetItem[], loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  loadAsset: async (assetId, withProfit) => {
    set({ loading: true, error: null })
    try {
      const asset = await fetchAsset(assetId, withProfit)
      set({ currentAsset: asset as AssetItem, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  addAsset: async (data) => {
    set({ error: null })
    try {
      const asset = await createAsset(data)
      set((state) => ({ assets: [...state.assets, asset] }))
      return asset
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
      throw err
    }
  },

  editAsset: async (assetId, data) => {
    set({ error: null })
    try {
      const updated = await updateAsset(assetId, data)
      set((state) => ({
        assets: state.assets.map((a) => (a.id === assetId ? updated : a)),
        currentAsset: state.currentAsset?.id === assetId ? updated : state.currentAsset,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  removeAsset: async (assetId) => {
    set({ error: null })
    try {
      await deleteAsset(assetId)
      set((state) => ({
        assets: state.assets.filter((a) => a.id !== assetId),
        currentAsset: state.currentAsset?.id === assetId ? null : state.currentAsset,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  updatePrice: async (assetId, currentPrice) => {
    set({ error: null })
    try {
      const updated = await updateAssetPrice(assetId, currentPrice)
      set((state) => ({
        assets: state.assets.map((a) => (a.id === assetId ? updated : a)),
        currentAsset: state.currentAsset?.id === assetId ? updated : state.currentAsset,
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message })
    }
  },

  loadPortfolioSummary: async () => {
    set({ loading: true, error: null })
    try {
      const summary = await fetchPortfolioSummary()
      set({ portfolioSummary: summary, loading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
