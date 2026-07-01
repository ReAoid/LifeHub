import { create } from 'zustand'
import apiClient from '@/base/api/client'
import type { ApiResponse } from '@/base/api/types'

export interface Tag {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
  updated_at: string
}

interface TagState {
  tags: Tag[]
  isLoading: boolean
  fetchTags: () => Promise<void>
  createTag: (name: string, color: string) => Promise<Tag>
  updateTag: (id: string, data: Partial<Tag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoading: false,

  fetchTags: async () => {
    set({ isLoading: true })
    try {
      const response = await apiClient.get<ApiResponse<Tag[]>>('/tags')
      set({ tags: response.data.data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  createTag: async (name: string, color: string) => {
    const response = await apiClient.post<ApiResponse<Tag>>('/tags', { name, color })
    const newTag = response.data.data
    set((state) => ({ tags: [...state.tags, newTag] }))
    return newTag
  },

  updateTag: async (id: string, data: Partial<Tag>) => {
    await apiClient.put(`/tags/${id}`, data)
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }))
  },

  deleteTag: async (id: string) => {
    await apiClient.delete(`/tags/${id}`)
    set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }))
  },
}))
