import { useEffect, useState } from 'react'
import { CheckSquare, TrendingUp, Target, Calendar } from 'lucide-react'
import { useAuthStore } from '@/base/stores/authStore'
import apiClient from '@/base/api/client'
import type { ApiResponse } from '@/base/api/types'

interface DashboardStats {
  today_tasks: number
  active_habits: number
  monthly_expenses: number
  total_assets: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({
    today_tasks: 0,
    active_habits: 0,
    monthly_expenses: 0,
    total_assets: 0,
  })

  useEffect(() => {
    // Fetch dashboard data
    apiClient
      .get<ApiResponse<DashboardStats>>('/dashboard')
      .then((res) => {
        if (res.data.data) setStats(res.data.data)
      })
      .catch(() => {
        // Dashboard endpoint not yet implemented; use defaults
      })
  }, [])

  const cards = [
    {
      title: "Today's Tasks",
      value: stats.today_tasks,
      icon: CheckSquare,
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      title: 'Active Habits',
      value: stats.active_habits,
      icon: Target,
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      title: 'Monthly Expenses',
      value: `¥${stats.monthly_expenses.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      title: 'Total Assets',
      value: `¥${stats.total_assets.toLocaleString()}`,
      icon: Calendar,
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.username || 'User'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's your life overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
              </div>
              <div className={`rounded-lg ${card.bg} p-3`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Placeholder for charts / upcoming content */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Upcoming Tasks</h3>
          <p className="text-sm text-muted-foreground">
            No tasks due today. Enjoy your day!
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">
            No recent transactions.
          </p>
        </div>
      </div>
    </div>
  )
}
