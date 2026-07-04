import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'
import { TaskCreatePayload } from '../api/dailyApi'

const priorityOptions = [
  { value: 1, label: 'P0 - 紧急重要', color: 'bg-red-500' },
  { value: 2, label: 'P1 - 重要不紧急', color: 'bg-orange-500' },
  { value: 3, label: 'P2 - 紧急不重要', color: 'bg-blue-500' },
  { value: 4, label: 'P3 - 普通', color: 'bg-gray-400' },
]

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'todo', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'done', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export default function TaskListPage() {
  const navigate = useNavigate()
  const { tasks, loading, loadTasks, addTask, removeTask, editTask } = useTaskStore()

  const [filter, setFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newTask, setNewTask] = useState<TaskCreatePayload>({
    title: '',
    priority: 4,
    status: 'todo',
  })

  const fetchData = useCallback(() => {
    loadTasks({
      status: filter || undefined,
      includeDone: filter === 'done',
    })
  }, [filter, loadTasks])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!newTask.title.trim()) return
    try {
      const task = await addTask(newTask)
      setNewTask({ title: '', priority: 4, status: 'todo' })
      setShowCreate(false)
      navigate(`/daily/tasks/${task.id}`)
    } catch {
      // error handled by store
    }
  }

  const handleToggleDone = async (taskId: string, isDone: boolean) => {
    await editTask(taskId, {
      status: isDone ? 'todo' : 'done',
    })
    fetchData()
  }

  const handleDelete = async (taskId: string) => {
    if (confirm('确定删除此任务？')) {
      await removeTask(taskId)
    }
  }

  const getPriorityColor = (p: number) => {
    return priorityOptions.find((o) => o.value === p)?.color || 'bg-gray-400'
  }

  const getPriorityLabel = (p: number) => {
    return priorityOptions.find((o) => o.value === p)?.label || 'P3'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">任务列表</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
        >
          {showCreate ? '取消' : '新建任务'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-lg border p-4 space-y-3 bg-card">
          <input
            type="text"
            placeholder="任务标题..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">优先级</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                {priorityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">截止日期</label>
              <input
                type="date"
                value={newTask.due_date || ''}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value || null })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newTask.title.trim()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
          >
            创建
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">暂无任务</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 text-sm text-primary hover:underline"
          >
            创建一个新任务
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors group"
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggleDone(task.id, task.status === 'done')}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  task.status === 'done'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                {task.status === 'done' && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Priority Badge */}
              <span className={`w-16 text-center text-xs font-medium text-white rounded ${getPriorityColor(task.priority)} py-0.5`}>
                {getPriorityLabel(task.priority)}
              </span>

              {/* Title & Description */}
              <Link to={`/daily/tasks/${task.id}`} className="flex-1 min-w-0">
                <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.due_date}
                    {task.due_time && ` ${task.due_time.slice(0, 5)}`}
                  </p>
                )}
              </Link>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
