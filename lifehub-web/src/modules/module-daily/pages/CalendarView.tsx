import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../stores/taskStore'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

/** Get the number of days in a month */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Get the day of week (0-6) for the first day of a month */
function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function CalendarViewPage() {
  const navigate = useNavigate()
  const { tasks, loadTasks } = useTaskStore()

  const today = useMemo(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth(), date: d.getDate(), str: d.toISOString().slice(0, 10) }
  }, [])

  const [viewYear, setViewYear] = useState(today.year)
  const [viewMonth, setViewMonth] = useState(today.month)
  const [selectedDate, setSelectedDate] = useState(today.str)

  useEffect(() => {
    // Load all tasks for the current month view
    const startDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`
    const endDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(daysInMonth(viewYear, viewMonth)).padStart(2, '0')}`
    loadTasks({ dueDateFrom: startDate, dueDateTo: endDate, includeDone: true })
  }, [viewYear, viewMonth, loadTasks])

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToday = () => {
    setViewYear(today.year)
    setViewMonth(today.month)
    setSelectedDate(today.str)
  }

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: Array<{ date: number; dateStr: string; isToday: boolean; isCurrentMonth: boolean }> = []
    const totalDays = daysInMonth(viewYear, viewMonth)
    const startDay = firstDayOfMonth(viewYear, viewMonth)

    // Previous month fillers
    const prevMonthDays = daysInMonth(viewMonth === 0 ? viewYear - 1 : viewYear, viewMonth === 0 ? 11 : viewMonth - 1)
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const m = viewMonth === 0 ? 11 : viewMonth - 1
      const y = viewMonth === 0 ? viewYear - 1 : viewYear
      days.push({
        date: d,
        dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isToday: false,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({
        date: d,
        dateStr,
        isToday: dateStr === today.str,
        isCurrentMonth: true,
      })
    }

    // Next month fillers to complete the grid
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear
      for (let d = 1; d <= remaining; d++) {
        const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        days.push({
          date: d,
          dateStr,
          isToday: false,
          isCurrentMonth: false,
        })
      }
    }

    return days
  }, [viewYear, viewMonth, today])

  // Tasks grouped by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {}
    for (const task of tasks) {
      if (task.due_date) {
        if (!map[task.due_date]) map[task.due_date] = []
        map[task.due_date].push(task)
      }
    }
    return map
  }, [tasks])

  // Selected date tasks
  const selectedTasks = tasksByDate[selectedDate] || []

  const monthLabel = `${viewYear}年${viewMonth + 1}月`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">日历视图</h1>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-1.5 rounded-md border text-sm hover:bg-accent">
            今天
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-lg border p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayTasks = tasksByDate[day.dateStr] || []
              const hasOverdue = dayTasks.some(
                (t) => t.due_date && t.due_date < today.str && t.status !== 'done'
              )
              const isSelected = day.dateStr === selectedDate

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(day.dateStr)
                    if (day.dateStr !== selectedDate) {
                      loadTasks({ dueDateFrom: day.dateStr, dueDateTo: day.dateStr, includeDone: true })
                    }
                  }}
                  className={`
                    min-h-[60px] p-1 border border-transparent rounded-lg text-sm relative
                    transition-colors
                    ${!day.isCurrentMonth ? 'opacity-30' : ''}
                    ${day.isToday ? 'bg-primary/10 border-primary/30' : ''}
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${!day.isToday && !isSelected && day.isCurrentMonth ? 'hover:bg-accent' : ''}
                  `}
                >
                  <span className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-full text-xs
                    ${day.isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                  `}>
                    {day.date}
                  </span>
                  {/* Task dots */}
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1 justify-center">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            t.status === 'done' ? 'bg-green-400' :
                            t.status === 'in_progress' ? 'bg-blue-400' :
                            hasOverdue ? 'bg-red-400' : 'bg-gray-400'
                          }`}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{dayTasks.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Side Panel: Selected Date Tasks */}
        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">
            {selectedDate === today.str ? (
              <span className="text-primary">今天 · {selectedDate}</span>
            ) : (
              selectedDate
            )}
          </h3>

          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              当日无任务
            </p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/daily/tasks/${task.id}`)}
                  className="rounded-lg border p-2.5 cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.status === 'done' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'cancelled' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    <span className={`text-sm flex-1 truncate ${
                      task.status === 'done' ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      task.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                      task.priority === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' :
                      task.priority === 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}>
                      P{task.priority - 1}
                    </span>
                    <span className="text-xs text-muted-foreground">{task.status === 'done' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待办'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
