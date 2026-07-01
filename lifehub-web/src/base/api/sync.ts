import apiClient from './client'
import type { ApiResponse } from './types'

export interface SyncChange {
  id: string
  entity_type: string
  entity_id: string
  action: string
  version: number
  synced_at: string
}

export async function getChanges(since: string, limit: number = 100): Promise<ApiResponse<SyncChange[]>> {
  const response = await apiClient.get('/sync/changes', { params: { since, limit } })
  return response.data
}
