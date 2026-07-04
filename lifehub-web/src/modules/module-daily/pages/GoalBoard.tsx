import { useEffect, useState, useCallback } from 'react'
import { useGoalStore } from '../stores/goalStore'

const goalTypeLabels: Record<string, string> = {
  annual: '年度目标',
  quarterly: '季度目标',
  monthly: '月度目标',
  weekly: '每周目标',
}

const typeColors: Record<string, string> = {
  annual: 'bg-purple-500',
  quarterly: 'bg-blue-500',
  monthly: 'bg-green-500',
  weekly: 'bg-orange-500',
}

export default function GoalBoardPage() {
  const { goals, loading, loadGoals, addGoal, editGoal, removeGoal, updateProgress } = useGoalStore()

  const [showCreate, setShowCreate] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [editProgressId, setEditProgressId] = useState<string | null>(null)
  const [progressValue, setProgressValue] = useState('')
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    goal_type: 'monthly',
    target_value: 0,
    unit: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
  })

  const fetchData = useCallback(() => {
    loadGoals({ goalType: filterType || undefined })
  }, [filterType, loadGoals])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!newGoal.title.trim() || newGoal.target_value <= 0) return
    try {
      await addGoal({
        ...newGoal,
        end_date: newGoal.end_date || undefined,
      })
      setNewGoal({
        title: '',
        description: '',
        goal_type: 'monthly',
        target_value: 0,
        unit: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
      })
      setShowCreate(false)
    } catch {
      // handled by store
    }
  }

  const handleUpdateProgress = async (goalId: string) => {
    const val = parseFloat(progressValue)
    if (isNaN(val)) return
    await updateProgress(goalId, val)
    setEditProgressId(null)
    setProgressValue('')
  }

  const handleStatusChange = async (goalId: string, status: string) => {
    await editGoal(goalId, { status })
  }

  const handleDelete = async (goalId: string) => {
    if (confirm('确定删除此目标？')) {
      await removeGoal(goalId)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">目标看板</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
        >
          {showCreate ? '取消' : '新建目标'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-lg border p-4 space-y-3 bg-card">
          <input
            type="text"
            placeholder="目标标题..."
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            autoFocus
          />
          <textarea
            placeholder="目标描述（可选）..."
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm min-h-[60px]"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">目标类型</label>
              <select
                value={newGoal.goal_type}
                onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="annual">年度目标</option>
                <option value="quarterly">季度目标</option>
                <option value="monthly">月度目标</option>
                <option value="weekly">每周目标</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">目标值</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="100"
                value={newGoal.target_value || ''}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">单位（次/小时/元等）</label>
              <input
                type="text"
                placeholder="次"
                value={newGoal.unit}
                onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">截止日期</label>
              <input
                type="date"
                value={newGoal.end_date}
                onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newGoal.title.trim() || newGoal.target_value <= 0}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
          >
            创建目标
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            !filterType ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}
        >
          全部
        </button>
        {Object.entries(goalTypeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterType(filterType === key ? '' : key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              filterType === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Goals */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">还没有目标</p>
          <button onClick={() => setShowCreate(true)} className="mt-2 text-sm text-primary hover:underline">
            设定一个新目标
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress = goal.progress ?? 0
            return (
              <div key={goal.id} className="rounded-lg border p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{goal.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${typeColors[goal.goal_type] || 'bg-gray-500'}`}>
                    {goalTypeLabels[goal.goal_type] || goal.goal_type}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{goal.current_value} {goal.unit || ''}</span>
                    <span className="text-muted-foreground">{goal.target_value} {goal.unit || ''}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressColor(progress)}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="font-medium">{progress}%</span>
                    <span className="text-muted-foreground">
                      {goal.start_date}
                      {goal.end_date ? ` ~ ${goal.end_date}` : ''}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                    goal.status === 'active' ? 'bg-green-500' :
                    goal.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
                  }`}>
                    {goal.status === 'active' ? '进行中' : goal.status === 'completed' ? '已完成' : '已放弃'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {goal.status === 'active' && (
                    <>
                      {editProgressId === goal.id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            step="0.01"
                            value={progressValue}
                            onChange={(e) => setProgressValue(e.target.value)}
                            className="w-20 px-2 py-1 rounded border bg-background text-xs"
                            placeholder={String(goal.current_value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateProgress(goal.id)
                              if (e.key === 'Escape') setEditProgressId(null)
                            }}
                          />
                          <button
                            onClick={() => handleUpdateProgress(goal.id)}
                            className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs"
                          >
                            更新
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditProgressId(goal.id)
                            setProgressValue(String(goal.current_value))
                          }}
                          className="px-3 py-1 rounded border text-xs hover:bg-accent"
                        >
                          更新进度
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(goal.id, 'completed')}
                        className="px-3 py-1 rounded border text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        标记完成
                      </button>
                    </>
                  )}
                  {goal.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(goal.id, 'abandoned')}
                      className="px-3 py-1 rounded border text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      放弃
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="px-3 py-1 rounded border text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
