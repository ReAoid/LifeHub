import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'
import { useGoalStore } from '../stores/goalStore'
import { useHabitStore } from '../stores/habitStore'

type PriorityLabel = 'P0' | 'P1' | 'P2' | 'P3'
type PriorityColor = 'red' | 'orange' | 'blue' | 'gray'

const priorityConfig: Record<number, { label: PriorityLabel; color: PriorityColor }> = {
  1: { label: 'P0', color: 'red' },
  2: { label: 'P1', color: 'orange' },
  3: { label: 'P2', color: 'blue' },
  4: { label: 'P3', color: 'gray' },
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function DailyHomePage() {
  const { tasks, loadTasks } = useTaskStore()
  const { goals, loadGoals } = useGoalStore()
  const { habits, loadHabits, checkIn } = useHabitStore()

  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 6) setGreeting('夜深了')
    else if (hour < 9) setGreeting('早上好')
    else if (hour < 12) setGreeting('上午好')
    else if (hour < 14) setGreeting('中午好')
    else if (hour < 18) setGreeting('下午好')
    else setGreeting('晚上好')
  }, [])

  useEffect(() => {
    loadTasks({ includeDone: false })
    loadGoals({ status: 'active' })
    loadHabits(true)
  }, [])

  const todayTasks = tasks.filter((t) => t.due_date === getTodayKey())
  const overdueTasks = tasks.filter(
    (t) => t.due_date && t.due_date < getTodayKey() && t.status !== 'done'
  )
  const todayHabits = habits.filter((h) => h.is_active)
  const activeGoals = goals.filter((g) => g.status === 'active')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting} 👋</h1>
          <p className="text-muted-foreground text-sm">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/daily/tasks" className="block">
          <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-muted-foreground">今日待办</p>
            <p className="text-3xl font-bold mt-1">{todayTasks.length}</p>
            {overdueTasks.length > 0 && (
              <p className="text-xs text-red-500 mt-1">{overdueTasks.length} 项已逾期</p>
            )}
          </div>
        </Link>

        <Link to="/daily/habits" className="block">
          <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-muted-foreground">习惯打卡</p>
            <p className="text-3xl font-bold mt-1">{todayHabits.length}</p>
            <p className="text-xs text-muted-foreground mt-1">个进行中习惯</p>
          </div>
        </Link>

        <Link to="/daily/goals" className="block">
          <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-muted-foreground">进行中目标</p>
            <p className="text-3xl font-bold mt-1">{activeGoals.length}</p>
          </div>
        </Link>

        <Link to="/daily/calendar" className="block">
          <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
            <p className="text-sm text-muted-foreground">日历视图</p>
            <p className="text-3xl font-bold mt-1">{new Date().getDate()}</p>
            <p className="text-xs text-muted-foreground mt-1">查看日程</p>
          </div>
        </Link>
      </div>

      {/* Today's Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">今日任务</h2>
          <Link to="/daily/tasks" className="text-sm text-primary hover:underline">
            查看全部
          </Link>
        </div>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
            今天没有待办任务 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map((task) => {
              const p = priorityConfig[task.priority] || priorityConfig[4]
              return (
                <Link
                  key={task.id}
                  to={`/daily/tasks/${task.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <span
                    className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-medium text-white bg-${p.color}-500`}
                    style={{
                      backgroundColor:
                        p.color === 'red' ? '#ef4444' :
                        p.color === 'orange' ? '#f97316' :
                        p.color === 'blue' ? '#3b82f6' : '#6b7280',
                    }}
                  >
                    {p.label}
                  </span>
                  <span className="flex-1 text-sm">{task.title}</span>
                  {task.due_time && (
                    <span className="text-xs text-muted-foreground">{task.due_time.slice(0, 5)}</span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Today's Habits Quick Check-in */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">今日习惯</h2>
          <Link to="/daily/habits" className="text-sm text-primary hover:underline">
            查看全部
          </Link>
        </div>
        {todayHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
            还没有习惯，去创建一个吧
          </p>
        ) : (
          <div className="space-y-2">
            {todayHabits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <span className="text-xl">{habit.icon || '📋'}</span>
                <span className="flex-1 text-sm">{habit.name}</span>
                <button
                  onClick={() => checkIn({ habit_id: habit.id })}
                  className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90"
                >
                  打卡
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Goals Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">目标进度</h2>
          <Link to="/daily/goals" className="text-sm text-primary hover:underline">
            查看全部
          </Link>
        </div>
        {activeGoals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
            还没有目标，去设定一个吧
          </p>
        ) : (
          <div className="space-y-3">
            {activeGoals.slice(0, 4).map((goal) => (
              <div key={goal.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {goal.current_value}/{goal.target_value} {goal.unit || ''}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(goal.progress ?? 0, 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {goal.progress ?? 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
