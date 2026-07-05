import { useState } from 'react'
import { BudgetWithSpending, AccountItem, createBill } from '../api/financeApi'

const categoryEmojis: Record<string, string> = {
  '餐饮': '🍽️',
  '交通': '🚗',
  '购物': '🛒',
  '居住': '🏠',
  '娱乐': '🎮',
  '教育': '📚',
  '医疗': '💊',
  '通讯': '📱',
  '服饰': '👔',
  '美妆': '💄',
  '社交': '🤝',
  '运动': '🏃',
  '旅行': '✈️',
  '宠物': '🐾',
  '数码': '💻',
  '其他': '📋',
}

const categoryColors: Record<string, string> = {
  '餐饮': '#f59e0b',
  '交通': '#3b82f6',
  '购物': '#ec4899',
  '居住': '#8b5cf6',
  '娱乐': '#10b981',
  '教育': '#6366f1',
  '医疗': '#ef4444',
  '通讯': '#06b6d4',
  '服饰': '#f97316',
  '美妆': '#d946ef',
  '社交': '#14b8a6',
  '运动': '#22c55e',
  '旅行': '#0ea5e9',
  '宠物': '#a855f7',
  '数码': '#64748b',
  '其他': '#6b7280',
}

interface BudgetCardProps {
  budget: BudgetWithSpending & { monthly_spending?: Array<{ month: number; spent: number; budget_share: number }> }
  year: number
  month: number
  accounts: AccountItem[]
  accountsLoading: boolean
  onEdit: (budget: any) => void
  onDelete: (budgetId: string) => void
  onRefresh: () => void
}

export default function BudgetCard({
  budget,
  year,
  month,
  accounts,
  accountsLoading,
  onEdit,
  onDelete,
  onRefresh,
}: BudgetCardProps) {
  const [showExpense, setShowExpense] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '')
  const [expenseSubmitting, setExpenseSubmitting] = useState(false)

  const pct = budget.percentage || 0
  const isOver = budget.is_over_budget
  const isYearly = budget.period === 'yearly'
  const monthlySpending = budget.monthly_spending
  const emoji = categoryEmojis[budget.category] || '📋'
  const color = categoryColors[budget.category] || '#6b7280'

  const handleQuickExpense = async () => {
    const amount = parseFloat(expenseAmount)
    if (!amount || amount <= 0) return
    if (!selectedAccountId) {
      alert('请选择支出账户')
      return
    }
    const now = new Date()
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
      setShowExpense(false)
      setExpenseAmount('')
      setExpenseDesc('')
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || '记录失败')
    } finally {
      setExpenseSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md">
      {/* Header: icon + name + badges */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: color + '20', color }}
          >
            <span className="text-xl">{emoji}</span>
          </div>
          <div>
            <h3 className="font-semibold">{budget.category}</h3>
            <div className="flex items-center gap-1.5">
              {isYearly && (
                <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  年度
                </span>
              )}
              {isOver && (
                <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-200">
                  超支
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
            ¥{budget.spent.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
                        预算 ¥{budget.amount.toLocaleString()}
                      </p>
        </div>
      </div>

      {/* Progress section */}
      <div className="mt-3">
        {/* Yearly: 12-column bar chart */}
        {isYearly && monthlySpending ? (
          <div>
            <div className="flex items-end gap-[3px]" style={{ height: '120px' }}>
              {monthlySpending.map((ms) => {
                const segPct = ms.budget_share > 0 ? (ms.spent / ms.budget_share) * 100 : (ms.spent > 0 ? 999 : 0)
                const isPast = ms.month <= month
                const isCurrentMonth = ms.month === month
                const isOverMonth = isPast && segPct > 100

                // Calculate bar height in px (relative to 120px container)
                let barHeightPx: number
                if (isOverMonth) {
                  barHeightPx = 120 // 超额到顶
                } else if (isPast && segPct > 0) {
                  barHeightPx = Math.max(Math.round(120 * segPct / 100), 16)
                } else if (isPast) {
                  barHeightPx = 10 // 过去月无支出
                } else {
                  barHeightPx = 10 // 未来月占位
                }

                let barColor = 'bg-secondary'
                if (isPast) {
                  if (segPct >= 100) barColor = 'bg-red-500'
                  else if (segPct > 80) barColor = 'bg-amber-500'
                  else if (segPct > 0) barColor = 'bg-green-500'
                  else barColor = 'bg-green-200'
                }

                return (
                  <div
                    key={ms.month}
                    className="relative flex flex-1 flex-col items-center gap-0.5"
                    title={`${ms.month}月: ¥${ms.spent.toLocaleString()} / ¥${ms.budget_share.toLocaleString()}`}
                  >
                    {/* Overspent indicator */}
                    {isOverMonth && (
                      <span className="absolute -top-3.5 text-xs leading-none" style={{ color }}>&#x26A0;&#xFE0F;</span>
                    )}
                    {/* Bar */}
                    <div
                      className={`w-full rounded-sm transition-all ${barColor} ${isCurrentMonth ? 'ring-1 ring-primary ring-offset-0' : ''}`}
                      style={{
                        height: `${barHeightPx}px`,
                        opacity: isPast ? 1 : 0.25,
                      }}
                    />
                    {/* Month label */}
                    <span className={`text-[10px] leading-none ${isCurrentMonth ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {ms.month}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>年度进度 {pct.toFixed(1)}%</span>
              <span>
                本月 ¥{(monthlySpending[month - 1]?.spent || 0).toLocaleString()} / ¥{(monthlySpending[month - 1]?.budget_share || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          /* Monthly: single progress bar */
          <>
            <div className="h-3 w-full rounded-full bg-secondary">
              <div
                className={`h-3 rounded-full transition-all ${
                  isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className={isOver ? 'font-bold text-red-600' : ''}>{pct.toFixed(1)}%</span>
              <span>剩余 ¥{Math.max(0, budget.remaining).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center justify-between border-t pt-2">
        <button
          onClick={() => {
            setShowExpense(!showExpense)
            if (!showExpense && accounts.length > 0 && !selectedAccountId) {
              setSelectedAccountId(accounts[0].id)
            }
          }}
          className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-40"
          disabled={accountsLoading}
        >
          {accountsLoading ? '加载账户...' : '+ 记一笔'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(budget)}
            className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            编辑
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            删除
          </button>
        </div>
      </div>

      {/* Quick expense form */}
      {showExpense && (
        <div className="mt-2 rounded-md border bg-muted/50 p-2">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            记录 {budget.category} 支出 — {year}年{month}月
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <label className="mb-0.5 block text-xs text-muted-foreground">金额</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">¥</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full rounded border bg-background py-1.5 pl-5 pr-2 text-xs"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="mb-0.5 block text-xs text-muted-foreground">账户</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full rounded border bg-background py-1.5 pl-2 pr-1 text-xs"
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
            <div>
              <label className="mb-0.5 block text-xs text-muted-foreground">备注</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full rounded border bg-background py-1.5 pl-2 pr-2 text-xs"
                placeholder="选填"
              />
            </div>
            <button
              onClick={handleQuickExpense}
              disabled={expenseSubmitting || !expenseAmount || parseFloat(expenseAmount) <= 0}
              className="rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
            >
              {expenseSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
