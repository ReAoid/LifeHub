import { useEffect, useState } from 'react'
import { useBudgetStore } from '../stores/budgetStore'
import { BudgetWithSpending, AccountItem, createBill, fetchAccounts, EXPENSE_CATEGORIES } from '../api/financeApi'
import { LoadingSpinner } from '@/base/components/LoadingSpinner'

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

  // Quick expense recording
  const [expenseBudgetId, setExpenseBudgetId] = useState<string | null>(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseSubmitting, setExpenseSubmitting] = useState(false)
  const [accounts, setAccounts] = useState<AccountItem[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState('')

  useEffect(() => {
    loadBudgetsWithSpending()
  }, [year, month])

  // Load accounts once on mount
  useEffect(() => {
    setAccountsLoading(true)
    fetchAccounts()
      .then((list) => {
        setAccounts(list)
        if (list.length > 0 && !selectedAccountId) {
          setSelectedAccountId(list[0].id)
        }
      })
      .catch(() => {})
      .finally(() => setAccountsLoading(false))
  }, [])

  const loadBudgetsWithSpending = async () => {
    await loadMonthlyOverview(year, month)
  }

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

  const handleQuickExpense = async (budget: any) => {
    const amount = parseFloat(expenseAmount)
    if (!amount || amount <= 0) return
    if (!selectedAccountId) {
      alert('请选择支出账户')
      return
    }
    setExpenseSubmitting(true)
    try {
      await createBill({
        account_id: selectedAccountId,
        bill_type: 'expense',
        amount,
        category: budget.category,
        description: expenseDesc || null,
        bill_date: `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      })
      setExpenseBudgetId(null)
      setExpenseAmount('')
      setExpenseDesc('')
      loadBudgetsWithSpending()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || '记录失败')
    } finally {
      setExpenseSubmitting(false)
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

      {/* Budget Progress Bars */}
      <div className="space-y-3">
        {budgetsList.map((budget: any) => {
          const pct = budget.percentage || 0
          const isOver = budget.is_over_budget
          const isYearly = budget.period === 'yearly'
          const monthlySpending = budget.monthly_spending as Array<{ month: number; spent: number; budget_share: number }> | undefined

          return (
            <div key={budget.id} className="rounded-lg border bg-card p-3 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{budget.category}</span>
                  {isYearly && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                      年度
                    </span>
                  )}
                  {isOver && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-200">
                      超支
                    </span>
                  )}
                </div>
                <div className="text-right text-sm">
                  <span className="font-medium">¥{budget.spent.toLocaleString()}</span>
                  <span className="text-muted-foreground"> / ¥{budget.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Progress bar: 12 segments for yearly, single bar for monthly */}
              {isYearly && monthlySpending ? (
                <div className="flex h-3 gap-0.5 rounded-full bg-secondary p-0.5">
                  {monthlySpending.map((ms) => {
                    const segPct = ms.budget_share > 0 ? (ms.spent / ms.budget_share) * 100 : 0
                    const isPast = ms.month <= month
                    const isCurrent = ms.month === month
                    return (
                      <div
                        key={ms.month}
                        className={`relative flex-1 rounded-sm transition-all ${
                          !isPast
                            ? 'bg-secondary'
                            : segPct >= 100
                              ? 'bg-red-500'
                              : segPct > 80
                                ? 'bg-amber-500'
                                : segPct > 0
                                  ? 'bg-green-500'
                                  : 'bg-green-200'
                        } ${isCurrent ? 'ring-1 ring-primary ring-offset-0' : ''}`}
                        style={{
                          opacity: isPast ? 1 : 0.3,
                          height: segPct > 0 ? `${Math.min(segPct, 100)}%` : '30%',
                          alignSelf: 'flex-end',
                        }}
                        title={`${ms.month}月: ¥${ms.spent.toLocaleString()} / ¥${ms.budget_share.toLocaleString()}`}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              )}

              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{pct.toFixed(1)}%</span>
                <span>剩余 ¥{Math.max(0, budget.remaining).toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-1">
                <button
                  onClick={() => {
                    setExpenseBudgetId(expenseBudgetId === budget.id ? null : budget.id)
                    setExpenseAmount('')
                    setExpenseDesc('')
                    if (accounts.length > 0 && !selectedAccountId) {
                      setSelectedAccountId(accounts[0].id)
                    }
                  }}
                  className="text-xs text-green-600 hover:underline disabled:opacity-40"
                  disabled={accountsLoading}
                >
                  {accountsLoading ? '加载账户...' : '+ 记一笔'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(budget)} className="text-xs text-blue-600 hover:underline">编辑</button>
                  <button onClick={() => handleDelete(budget.id)} className="text-xs text-red-600 hover:underline">删除</button>
                </div>
              </div>

              {/* Quick expense form */}
              {expenseBudgetId === budget.id && (
                <div className="mt-2 rounded-md border bg-muted/50 p-2">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    记录 {budget.category} 支出 — {year}年{month}月
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1">
                      <label className="mb-0.5 block text-xs text-muted-foreground">金额</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">¥</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          className="w-full rounded border bg-background py-1 pl-5 pr-2 text-xs"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="mb-0.5 block text-xs text-muted-foreground">账户</label>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full rounded border bg-background py-1 pl-2 pr-1 text-xs"
                      >
                        {accountsLoading ? (
                          <option value="">加载中...</option>
                        ) : accounts.length === 0 ? (
                          <option value="">暂无账户, 请先添加</option>
                        ) : null}
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="mb-0.5 block text-xs text-muted-foreground">备注</label>
                      <input
                        type="text"
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        className="w-full rounded border bg-background py-1 pl-2 pr-2 text-xs"
                        placeholder="选填"
                      />
                    </div>
                    <button
                      onClick={() => handleQuickExpense(budget)}
                      disabled={expenseSubmitting || !expenseAmount || parseFloat(expenseAmount) <= 0}
                      className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {expenseSubmitting ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Uncategorized spending */}
        {uncategorizedSpent > 0 && (
          <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
            未分类支出: ¥{uncategorizedSpent.toLocaleString()}
          </div>
        )}

        {budgetsList.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <p>暂无预算，点击"添加预算"开始</p>
          </div>
        )}
      </div>

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
