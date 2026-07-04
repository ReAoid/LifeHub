import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchFinanceOverview, FinanceOverview } from '../api/financeApi'
import { LoadingSpinner } from '@/base/components/LoadingSpinner'

export default function FinanceHomePage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFinanceOverview()
      setOverview(data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-500">加载失败: {error}</p>
  if (!overview) return <p className="text-muted-foreground">暂无数据</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">资产总览</h1>
        <button
          onClick={loadOverview}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm hover:bg-secondary"
        >
          刷新
        </button>
      </div>

      {/* Net Worth Card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">净资产</p>
        <p className={`text-3xl font-bold ${overview.net_worth.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ¥{overview.net_worth.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-green-600">总资产: ¥{overview.net_worth.assets.toLocaleString()}</span>
          <span className="text-red-600">总负债: ¥{overview.net_worth.liabilities.toLocaleString()}</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Summary */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">本月收支</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-600">收入</span>
              <span className="font-medium">¥{overview.monthly_summary.income.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">支出</span>
              <span className="font-medium">¥{overview.monthly_summary.expense.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>结余</span>
              <span className={overview.monthly_summary.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                ¥{overview.monthly_summary.net.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        {overview.portfolio_summary.total_value > 0 && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">投资概览</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>持仓市值</span>
                <span className="font-medium">¥{overview.portfolio_summary.total_value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>总盈亏</span>
                <span className={`font-medium ${overview.portfolio_summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overview.portfolio_summary.total_profit >= 0 ? '+' : ''}
                  ¥{overview.portfolio_summary.total_profit.toLocaleString()}
                  <span className="ml-1">
                    ({overview.portfolio_summary.total_profit_percentage.toFixed(2)}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty portfolio placeholder */}
        {overview.portfolio_summary.total_value === 0 && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">投资概览</h3>
            <p className="text-sm text-muted-foreground">暂无持仓数据</p>
            <button
              onClick={() => navigate('/finance/portfolio')}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              添加资产
            </button>
          </div>
        )}
      </div>

      {/* Accounts Overview */}
      <div>
        <h3 className="mb-3 font-semibold">账户概览</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {overview.accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-lg border bg-card p-3 shadow-sm transition hover:shadow-md"
            >
              <p className="text-sm text-muted-foreground">{acc.name}</p>
              <p className="text-lg font-bold">
                ¥{acc.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">{acc.account_type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/finance/accounts')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          管理账户
        </button>
        <button
          onClick={() => navigate('/finance/bills')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          查看账单
        </button>
        <button
          onClick={() => navigate('/finance/budgets')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          预算管理
        </button>
        <button
          onClick={() => navigate('/finance/portfolio')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          持仓管理
        </button>
        <button
          onClick={() => navigate('/finance/invest-plans')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          定投计划
        </button>
      </div>
    </div>
  )
}
