import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'
import { TaskUpdatePayload } from '../api/dailyApi'

const statusOptions = [
  { value: 'todo', label: '待办', color: 'bg-gray-500' },
  { value: 'in_progress', label: '进行中', color: 'bg-blue-500' },
  { value: 'done', label: '已完成', color: 'bg-green-500' },
  { value: 'cancelled', label: '已取消', color: 'bg-red-500' },
]

const priorityOptions = [
  { value: 1, label: 'P0 - 紧急重要' },
  { value: 2, label: 'P1 - 重要不紧急' },
  { value: 3, label: 'P2 - 紧急不重要' },
  { value: 4, label: 'P3 - 普通' },
]

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { currentTask, loading, loadTask, editTask, removeTask } = useTaskStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<TaskUpdatePayload>({})

  useEffect(() => {
    if (taskId) loadTask(taskId)
  }, [taskId, loadTask])

  useEffect(() => {
    if (currentTask && isEditing) {
      setEditForm({
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        status: currentTask.status,
        due_date: currentTask.due_date,
        due_time: currentTask.due_time,
      })
    }
  }, [currentTask, isEditing])

  const handleSave = async () => {
    if (!taskId) return
    await editTask(taskId, editForm)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!taskId) return
    if (confirm('确定删除此任务？')) {
      await removeTask(taskId)
      navigate('/daily/tasks')
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!taskId) return
    await editTask(taskId, { status })
  }

  if (loading || !currentTask) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>
  }

  const currentStatus = statusOptions.find((s) => s.value === currentTask.status)!

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/daily/tasks" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回任务列表
      </Link>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${currentStatus.color}`}>
          {currentStatus.label}
        </span>
        <span className="text-xs text-muted-foreground">
          优先级: {priorityOptions.find((p) => p.value === currentTask.priority)?.label || 'P3'}
        </span>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <div className="space-y-4">
          <input
            type="text"
            value={editForm.title || ''}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background text-lg font-bold"
          />
          <textarea
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm min-h-[100px]"
            placeholder="添加描述..."
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">优先级</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                {priorityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">状态</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">截止日期</label>
              <input
                type="date"
                value={editForm.due_date || ''}
                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value || null })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">截止时间</label>
              <input
                type="time"
                value={editForm.due_time || ''}
                onChange={(e) => setEditForm({ ...editForm, due_time: e.target.value || null })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">
              保存
            </button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-md border text-sm">
              取消
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{currentTask.title}</h1>

          {currentTask.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentTask.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {currentTask.due_date && (
              <div>
                <span className="text-muted-foreground">截止日期: </span>
                {currentTask.due_date}
                {currentTask.due_time && ` ${currentTask.due_time.slice(0, 5)}`}
              </div>
            )}
            {currentTask.is_recurring && (
              <div>
                <span className="text-muted-foreground">重复: </span>
                {currentTask.recur_rule ? JSON.stringify(currentTask.recur_rule) : '是'}
              </div>
            )}
            {currentTask.completed_at && (
              <div>
                <span className="text-muted-foreground">完成时间: </span>
                {new Date(currentTask.completed_at).toLocaleString('zh-CN')}
              </div>
            )}
          </div>

          {/* Quick Status Change */}
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                disabled={s.value === currentTask.status}
                className={`px-3 py-1.5 rounded-full text-xs font-medium text-white transition-opacity ${
                  s.color
                } ${s.value === currentTask.status ? 'opacity-100 ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-md border text-sm hover:bg-accent"
            >
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-md border border-red-200 text-red-600 text-sm hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
