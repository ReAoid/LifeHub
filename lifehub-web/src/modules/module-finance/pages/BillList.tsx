import { useEffect, useState } from 'react'
import { useAccountStore } from '../stores/accountStore'
import { useBillStore } from '../stores/billStore'
import { BillCreatePayload } from '../api/financeApi'
import BillForm from '../components/BillForm'
import { LoadingSpinner } from '@/base/components/LoadingSpinner'

const BILL_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  income: { label: '收入', color: 'text-green-600' },
  expense: { label: '支出', color: 'text-red-600' },
  transfer: { label: '转账', color: 'text-blue-600' },
}

export default function BillListPage() {
  const { accounts, loadAccounts } = useAccountStore()
  const { bills, total, loading, error, loadBills, addBill, removeBill, loadCategories, categories } = useBillStore()

  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 20

  useEffect(() => {
    loadAccounts()
    loadCategories()
  }, [])

  useEffect(() => {
    loadBillsWithFilters()
  }, [filterType, filterCategory, filterDateFrom, filterDateTo, page])

  const loadBillsWithFilters = () => {
    loadBills({
      billType: filterType || undefined,
      category: filterCategory || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      limit: pageSize,
      offset: page * pageSize,
    })
  }

  const handleCreateBill = async (data: BillCreatePayload) => {
    setFormError('')
    setSubmitting(true)
    try {
      await addBill(data)
      setShowForm(false)
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBill = async (billId: string) => {
    if (window.confirm('确定删除此账单？将自动调整账户余额。')) {
      await removeBill(billId)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && bills.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">账单流水</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? '取消' : '记一笔'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Create Bill Form */}
      {showForm && (
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">记一笔</h3>
          {formError && <p className="mb-2 text-sm text-red-500">{formError}</p>}
          <BillForm
            accounts={accounts}
            onSubmit={handleCreateBill}
            onCancel={() => setShowForm(false)}
            isSubmitting={submitting}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(0) }}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">全部类型</option>
          <option value="income">收入</option>
          <option value="expense">支出</option>
          <option value="transfer">转账</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(0) }}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0) }}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm"
          placeholder="开始日期"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => { setFilterDateTo(e.target.value); setPage(0) }}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm"
          placeholder="结束日期"
        />
        <button
          onClick={() => {
            setFilterType('')
            setFilterCategory('')
            setFilterDateFrom('')
            setFilterDateTo('')
            setPage(0)
          }}
          className="rounded-lg border bg-background px-3 py-1.5 text-sm hover:bg-secondary"
        >
          重置
        </button>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <p>暂无账单记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => {
            const account = accounts.find((a) => a.id === bill.account_id)
            const typeInfo = BILL_TYPE_LABELS[bill.bill_type] || { label: bill.bill_type, color: '' }
            return (
              <div
                key={bill.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                    {bill.category.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{bill.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {account?.name || '未知账户'}
                      {bill.description ? ` · ${bill.description}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${typeInfo.color}`}>
                    {bill.bill_type === 'income' ? '+' : bill.bill_type === 'expense' ? '-' : ''}
                    ¥{bill.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">{bill.bill_date}</p>
                </div>
                <button
                  onClick={() => handleDeleteBill(bill.id)}
                  className="ml-2 rounded p-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            第 {page + 1} / {totalPages} 页 (共 {total} 条)
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
