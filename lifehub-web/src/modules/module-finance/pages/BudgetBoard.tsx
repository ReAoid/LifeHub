import { useEffect, useState, useCallback } from 'react'
import { useBudgetStore } from '../stores/budgetStore'
import { BudgetWithSpending, AccountItem, fetchAccounts, EXPENSE_CATEGORIES } from '../api/financeApi'
import { LoadingSpinner } from '@/base/components/LoadingSpinner'
import BudgetCard from '../components/BudgetCard'

export default function BudgetBoardPage() {
  const { budgets, monthlyOverview, loading, error, loadBudgets, loadMonthlyOverview, addBudget, editBudget, removeBudget } = useBudgetStore()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: '其他',
    amount: 0,
    period: 'monthly' as const,
    month: now.getMonth() + 1,
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)

  const loadBudgetsWithSpending = useCallback(async () => {
    await loadMonthlyOverview(year, month)
  }, [year, month, loadMonthlyOverview])

  useEffect(() => {
    loadBudgetsWithSpending()
  }, [loadBudgetsWithSpending])

  // Load accounts once on mount
  useEffect(() => {
    setAccountsLoading(true)
    fetchAccounts()
      .then((list) => {
        setAccounts(list)
      })
      .catch(() => {})
      .finally(() => setAccountsLoading(false))
  }, [])

  const resetForm = () => {
    setFormData({ category: '其他', amount: 0, period: 'monthly', month })
    setFormError('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (budget: BudgetWithSpending | any) => {
    setEditingId(budget.id)
    setFormData({
      category: budget.category,
      amount: budget.amount,
      period: budget.period || 'monthly',
      month: budget.month || month,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.category) {
      setFormError('请选择分类')
      return
    }
    if (formData.amount <= 0) {
      setFormError('请输入有效的预算金额')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await editBudget(editingId, { ...formData, year, month: formData.period === 'monthly' ? formData.month : null } as any)
      } else {
        await addBudget({
          category: formData.category,
          amount: formData.amount,
          period: formData.period,
          year,
          month: formData.period === 'monthly' ? formData.month : undefined,
        })
      }
      resetForm()
      loadBudgetsWithSpending()
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (budgetId: string) => {
    if (window.confirm('确定删除此预算？')) {
      await removeBudget(budgetId)
      loadBudgetsWithSpending()
    }
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  if (loading && !monthlyOverview) return <LoadingSpinner />

  const budgetsList = monthlyOverview?.budgets || []
  const totalBudget = monthlyOverview?.total_budget || 0
  const totalSpent = monthlyOverview?.total_spent || 0
  const uncategorizedSpent = monthlyOverview?.uncategorized_spent || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">预算管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? '取消' : '添加预算'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Month Navigator */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <button onClick={handlePrevMonth} className="rounded-lg px-3 py-1 hover:bg-secondary">&larr;</button>
        <span className="font-semibold">{year} 年 {month} 月{isCurrentMonth ? ' (本月)' : ''}</span>
        <button
          onClick={handleNextMonth}
          disabled={isCurrentMonth}
          className="rounded-lg px-3 py-1 hover:bg-secondary disabled:opacity-50"
        >
          &rarr;
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">总预算</p>
          <p className="text-2xl font-bold">¥{totalBudget.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">已支出</p>
          <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
            ¥{totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">剩余</p>
          <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ¥{Math.max(0, totalBudget - totalSpent).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Budget Cards - Grid Layout */}
      {budgetsList.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <p>暂无预算，点击"添加预算"开始</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Monthly Budgets Section */}
          {(() => {
            const monthlyBudgets = budgetsList.filter((b: any) => b.period !== 'yearly')
            const yearlyBudgets = budgetsList.filter((b: any) => b.period === 'yearly')

            return (
              <>
                {monthlyBudgets.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <h2 className="text-lg font-semibold">月度预算</h2>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                        {monthlyBudgets.length} 项
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {monthlyBudgets.map((budget: any) => (
                        <BudgetCard
                          key={budget.id}
                          budget={budget}
                          year={year}
                          month={month}
                          accounts={accounts}
                          accountsLoading={accountsLoading}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onRefresh={loadBudgetsWithSpending}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider between monthly and annual */}
                {monthlyBudgets.length > 0 && yearlyBudgets.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-xs text-muted-foreground">年度预算</span>
                    </div>
                  </div>
                )}

                {yearlyBudgets.length > 0 && (
                  <div>
                    {monthlyBudgets.length === 0 && (
                      <div className="mb-4 flex items-center gap-2">
                        <h2 className="text-lg font-semibold">年度预算</h2>
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                          {yearlyBudgets.length} 项
                        </span>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {yearlyBudgets.map((budget: any) => (
                        <BudgetCard
                          key={budget.id}
                          budget={budget}
                          year={year}
                          month={month}
                          accounts={accounts}
                          accountsLoading={accountsLoading}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onRefresh={loadBudgetsWithSpending}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          })()}

          {/* Uncategorized spending */}
          {uncategorizedSpent > 0 && (
            <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
              未分类支出: ¥{uncategorizedSpent.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h3 className="font-semibold">{editingId ? '编辑预算' : '添加预算'}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">选择分类</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">预算金额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border bg-background px-8 py-2 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">周期</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
              </select>
            </div>
            {formData.period === 'monthly' && (
              <div>
                <label className="mb-1 block text-sm">月份</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m} 月</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? '保存中...' : editingId ? '更新' : '创建'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-lg border bg-background px-4 py-2 text-sm hover:bg-secondary">
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
