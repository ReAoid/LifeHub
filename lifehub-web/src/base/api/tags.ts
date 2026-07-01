import apiClient from './client'
import type { ApiResponse } from './types'

export interface Tag {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface TagLink {
  id: string
  tag_id: string
  target_type: string
  target_id: string
  user_id: string
}

export async function getTags(): Promise<ApiResponse<Tag[]>> {
  const response = await apiClient.get('/tags')
  return response.data
}

export async function createTag(name: string, color: string): Promise<ApiResponse<Tag>> {
  const response = await apiClient.post('/tags', { name, color })
  return response.data
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<ApiResponse<Tag>> {
  const response = await apiClient.put(`/tags/${id}`, data)
  return response.data
}

export async function deleteTag(id: string): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`/tags/${id}`)
  return response.data
}

export async function getTagLinks(targetType: string, targetId: string): Promise<ApiResponse<TagLink[]>> {
  const response = await apiClient.get(`/tags/links/${targetType}/${targetId}`)
  return response.data
}

export async function createTagLink(tagId: string, targetType: string, targetId: string): Promise<ApiResponse<TagLink>> {
  const response = await apiClient.post('/tags/links', { tag_id: tagId, target_type: targetType, target_id: targetId })
  return response.data
}

export async function deleteTagLink(linkId: string): Promise<ApiResponse<null>> {
  const response = await apiClient.delete(`/tags/links/${linkId}`)
  return response.data
}
