import { useEffect, useState, useCallback } from 'react'
import { useHabitStore } from '../stores/habitStore'
import { useGoalStore } from '../stores/goalStore'

export default function HabitTrackerPage() {
  const {
    habits, loading, loadHabits,
    addHabit, editHabit, removeHabit, checkIn,
    streak, loadStreak, habitLogs, loadLogs,
  } = useHabitStore()
  const { updateProgress } = useGoalStore()

  const [showCreate, setShowCreate] = useState(false)
  const [newHabit, setNewHabit] = useState({
    name: '',
    frequency: 'daily',
    target_count: 1,
    icon: '📋',
    color: '#6366f1',
  })
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'habits' | 'logs'>('habits')

  const today = new Date().toISOString().slice(0, 10)

  const fetchData = useCallback(() => {
    loadHabits(true)
  }, [loadHabits])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (selectedHabitId) {
      const habit = habits.find((h) => h.id === selectedHabitId)
      if (habit) {
        loadStreak(selectedHabitId)
        // Load logs for last 30 days
        const dateTo = today
        const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        loadLogs({ habitId: selectedHabitId, dateFrom, dateTo })
      }
    }
  }, [selectedHabitId, habits])

  const handleCreate = async () => {
    if (!newHabit.name.trim()) return
    try {
      await addHabit(newHabit)
      setNewHabit({ name: '', frequency: 'daily', target_count: 1, icon: '📋', color: '#6366f1' })
      setShowCreate(false)
    } catch {
      // handled by store
    }
  }

  const handleCheckIn = async (habitId: string) => {
    await checkIn({ habit_id: habitId })
  }

  const handleDelete = async (habitId: string) => {
    if (confirm('确定删除此习惯？所有打卡记录也会被删除。')) {
      await removeHabit(habitId)
      if (selectedHabitId === habitId) {
        setSelectedHabitId(null)
      }
    }
  }

  const toggleActive = async (habitId: string, isActive: boolean) => {
    await editHabit(habitId, { is_active: isActive })
  }

  // Generate last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })

  const loggedDates = new Set(habitLogs.map((l) => l.log_date))

  const iconOptions = ['📋', '💪', '📚', '🏃', '🧘', '🥗', '💧', '🛌', '🎯', '✍️', '🎨', '🎵']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">习惯打卡</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
        >
          {showCreate ? '取消' : '新建习惯'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-lg border p-4 space-y-3 bg-card">
          <input
            type="text"
            placeholder="习惯名称..."
            value={newHabit.name}
            onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
            className="w-full px-3 py-2 rounded-md border bg-background text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">频率</label>
              <select
                value={newHabit.frequency}
                onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="daily">每日</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">每日目标次数</label>
              <input
                type="number"
                min={1}
                value={newHabit.target_count}
                onChange={(e) => setNewHabit({ ...newHabit, target_count: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">图标</label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewHabit({ ...newHabit, icon })}
                  className={`text-xl w-8 h-8 flex items-center justify-center rounded ${
                    newHabit.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-accent'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newHabit.name.trim()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
          >
            创建习惯
          </button>
        </div>
      )}

      {/* Habits Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : habits.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">还没有习惯</p>
          <button onClick={() => setShowCreate(true)} className="mt-2 text-sm text-primary hover:underline">
            创建一个新习惯
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const isTodayLogged = habitLogs.some(
              (l) => l.habit_id === habit.id && l.log_date === today
            )
            return (
              <div
                key={habit.id}
                className={`rounded-lg border p-4 ${
                  selectedHabitId === habit.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedHabitId(
                  selectedHabitId === habit.id ? null : habit.id
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{habit.icon || '📋'}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{habit.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {habit.frequency === 'daily' ? '每日' :
                       habit.frequency === 'weekly' ? '每周' :
                       habit.frequency === 'monthly' ? '每月' : '自定义'}
                      {' · '}目标 {habit.target_count} 次
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCheckIn(habit.id)
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isTodayLogged
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {isTodayLogged ? '✅ 已打卡' : '打卡'}
                  </button>
                </div>

                {/* Mini Calendar (last 7 days) */}
                <div className="flex gap-1 mb-3">
                  {last30Days.slice(-7).map((date) => {
                    const logged = loggedDates.has(date)
                    const isToday = date === today
                    return (
                      <div
                        key={date}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                          isToday ? 'ring-2 ring-primary' : ''
                        } ${
                          logged
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
                        }`}
                        title={date}
                      >
                        {new Date(date).getDate()}
                      </div>
                    )
                  })}
                </div>

                {/* Streak Info */}
                {streak && selectedHabitId === habit.id && (
                  <div className="flex gap-4 text-xs text-muted-foreground border-t pt-2 mt-2">
                    <span>连续: <strong className="text-foreground">{streak.current_streak}</strong> 天</span>
                    <span>最长: <strong className="text-foreground">{streak.longest_streak}</strong> 天</span>
                    <span>总计: <strong className="text-foreground">{streak.total_logs}</strong> 次</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-2 pt-2 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleActive(habit.id, !habit.is_active)
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      habit.is_active
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {habit.is_active ? '暂停' : '启用'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(habit.id)
                    }}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Monthly Calendar View */}
      {selectedHabitId && (
        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">近30天打卡记录</h3>
          <div className="grid grid-cols-7 gap-1">
            {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
            ))}
            {/* Add empty cells for alignment */}
            {Array.from({ length: new Date(last30Days[0]).getDay() || 7 }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {last30Days.map((date) => {
              const logged = loggedDates.has(date)
              const isToday = date === today
              return (
                <div
                  key={date}
                  className={`aspect-square rounded flex items-center justify-center text-xs ${
                    isToday ? 'ring-2 ring-primary' : ''
                  } ${
                    logged
                      ? 'bg-green-500 text-white font-medium'
                      : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
                  }`}
                  title={`${date}: ${logged ? '已打卡' : '未打卡'}`}
                >
                  {new Date(date).getDate()}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
