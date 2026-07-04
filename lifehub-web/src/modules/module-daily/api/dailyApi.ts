import apiClient from '@/base/api/client'
import { ApiResponse } from '@/base/api/types'

// ==================== Types ====================

export interface TaskItem {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: number
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  due_date: string | null
  due_time: string | null
  parent_id: string | null
  sort_order: number
  is_recurring: boolean
  recur_rule: Record<string, any> | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreatePayload {
  title: string
  description?: string | null
  priority?: number
  status?: string
  due_date?: string | null
  due_time?: string | null
  parent_id?: string | null
  sort_order?: number
  is_recurring?: boolean
  recur_rule?: Record<string, any> | null
}

export interface TaskUpdatePayload {
  title?: string
  description?: string | null
  priority?: number
  status?: string
  due_date?: string | null
  due_time?: string | null
  parent_id?: string | null
  sort_order?: number
  is_recurring?: boolean
  recur_rule?: Record<string, any> | null
}

export interface HabitItem {
  id: string
  user_id: string
  name: string
  description: string | null
  frequency: string
  target_count: number
  icon: string | null
  color: string | null
  start_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HabitLogItem {
  id: string
  habit_id: string
  log_date: string
  count: number
  note: string | null
  created_at: string
  updated_at: string
}

export interface HabitStreak {
  current_streak: number
  longest_streak: number
  total_logs: number
}

export interface GoalItem {
  id: string
  user_id: string
  title: string
  description: string | null
  goal_type: string
  target_value: number
  current_value: number
  unit: string | null
  start_date: string
  end_date: string | null
  status: 'active' | 'completed' | 'abandoned'
  progress: number | null
  created_at: string
  updated_at: string
}

// ==================== Task APIs ====================

export async function fetchTasks(params?: {
  status?: string
  priority?: number
  dueDateFrom?: string
  dueDateTo?: string
  includeDone?: boolean
}): Promise<TaskItem[]> {
  const response = await apiClient.get<ApiResponse<TaskItem[]>>('/daily/tasks', { params })
  return response.data.data
}

export async function fetchTask(taskId: string): Promise<TaskItem> {
  const response = await apiClient.get<ApiResponse<TaskItem>>(`/daily/tasks/${taskId}`)
  return response.data.data
}

export async function createTask(data: TaskCreatePayload): Promise<TaskItem> {
  const response = await apiClient.post<ApiResponse<TaskItem>>('/daily/tasks', data)
  return response.data.data
}

export async function updateTask(taskId: string, data: TaskUpdatePayload): Promise<TaskItem> {
  const response = await apiClient.put<ApiResponse<TaskItem>>(`/daily/tasks/${taskId}`, data)
  return response.data.data
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/daily/tasks/${taskId}`)
}

export async function reorderTasks(taskIds: string[]): Promise<TaskItem[]> {
  const response = await apiClient.put<ApiResponse<TaskItem[]>>('/daily/tasks/reorder', taskIds)
  return response.data.data
}

export async function fetchSubtasks(taskId: string): Promise<TaskItem[]> {
  const response = await apiClient.get<ApiResponse<TaskItem[]>>(`/daily/tasks/${taskId}/subtasks`)
  return response.data.data
}

// ==================== Habit APIs ====================

export async function fetchHabits(isActive?: boolean): Promise<HabitItem[]> {
  const response = await apiClient.get<ApiResponse<HabitItem[]>>('/daily/habits', {
    params: { isActive },
  })
  return response.data.data
}

export async function fetchHabit(habitId: string): Promise<HabitItem> {
  const response = await apiClient.get<ApiResponse<HabitItem>>(`/daily/habits/${habitId}`)
  return response.data.data
}

export async function createHabit(data: {
  name: string
  description?: string
  frequency?: string
  target_count?: number
  icon?: string
  color?: string
  start_date?: string
}): Promise<HabitItem> {
  const response = await apiClient.post<ApiResponse<HabitItem>>('/daily/habits', data)
  return response.data.data
}

export async function updateHabit(
  habitId: string,
  data: Partial<{
    name: string
    description: string
    frequency: string
    target_count: number
    icon: string
    color: string
    is_active: boolean
  }>
): Promise<HabitItem> {
  const response = await apiClient.put<ApiResponse<HabitItem>>(`/daily/habits/${habitId}`, data)
  return response.data.data
}

export async function deleteHabit(habitId: string): Promise<void> {
  await apiClient.delete(`/daily/habits/${habitId}`)
}

export async function fetchHabitStreak(habitId: string): Promise<HabitStreak> {
  const response = await apiClient.get<ApiResponse<HabitStreak>>(`/daily/habits/${habitId}/streak`)
  return response.data.data
}

// ==================== Habit Log APIs ====================

export async function fetchHabitLogs(params?: {
  habitId?: string
  dateFrom?: string
  dateTo?: string
}): Promise<HabitLogItem[]> {
  const response = await apiClient.get<ApiResponse<HabitLogItem[]>>('/daily/habit-logs', { params })
  return response.data.data
}

export async function logHabit(data: {
  habit_id: string
  log_date?: string
  count?: number
  note?: string
}): Promise<HabitLogItem> {
  const response = await apiClient.post<ApiResponse<HabitLogItem>>('/daily/habit-logs', data)
  return response.data.data
}

export async function updateHabitLog(
  logId: string,
  data: { count?: number; note?: string }
): Promise<HabitLogItem> {
  const response = await apiClient.put<ApiResponse<HabitLogItem>>(`/daily/habit-logs/${logId}`, data)
  return response.data.data
}

export async function deleteHabitLog(logId: string): Promise<void> {
  await apiClient.delete(`/daily/habit-logs/${logId}`)
}

// ==================== Goal APIs ====================

export async function fetchGoals(params?: {
  status?: string
  goalType?: string
}): Promise<GoalItem[]> {
  const response = await apiClient.get<ApiResponse<GoalItem[]>>('/daily/goals', { params })
  return response.data.data
}

export async function fetchGoal(goalId: string): Promise<GoalItem> {
  const response = await apiClient.get<ApiResponse<GoalItem>>(`/daily/goals/${goalId}`)
  return response.data.data
}

export async function createGoal(data: {
  title: string
  description?: string
  goal_type?: string
  target_value?: number
  current_value?: number
  unit?: string
  start_date?: string
  end_date?: string
}): Promise<GoalItem> {
  const response = await apiClient.post<ApiResponse<GoalItem>>('/daily/goals', data)
  return response.data.data
}

export async function updateGoal(
  goalId: string,
  data: Partial<{
    title: string
    description: string
    goal_type: string
    target_value: number
    current_value: number
    unit: string
    status: string
  }>
): Promise<GoalItem> {
  const response = await apiClient.put<ApiResponse<GoalItem>>(`/daily/goals/${goalId}`, data)
  return response.data.data
}

export async function deleteGoal(goalId: string): Promise<void> {
  await apiClient.delete(`/daily/goals/${goalId}`)
}

export async function updateGoalProgress(goalId: string, currentValue: number): Promise<GoalItem> {
  const response = await apiClient.put<ApiResponse<GoalItem>>(
    `/daily/goals/${goalId}/progress?currentValue=${currentValue}`
  )
  return response.data.data
}
