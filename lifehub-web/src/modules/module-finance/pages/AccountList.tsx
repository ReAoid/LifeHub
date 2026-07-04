import { useEffect, useState } from 'react'
import { useAccountStore } from '../stores/accountStore'
import { AccountItem } from '../api/financeApi'
import AccountCard from '../components/AccountCard'
import { LoadingSpinner } from '@/base/components/LoadingSpinner'

export default function AccountListPage() {
  const { accounts, loading, error, loadAccounts, addAccount, editAccount, removeAccount } = useAccountStore()
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'bank' as AccountItem['account_type'],
    currency: 'CNY',
    balance: 0,
    icon: '',
    color: '#6366f1',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  const resetForm = () => {
    setFormData({ name: '', account_type: 'bank', currency: 'CNY', balance: 0, icon: '', color: '#6366f1' })
    setFormError('')
    setEditingAccount(null)
    setShowForm(false)
  }

  const handleEdit = (account: AccountItem) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      account_type: account.account_type,
      currency: account.currency,
      balance: account.balance,
      icon: account.icon || '',
      color: account.color || '#6366f1',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('请输入账户名称')
      return
    }

    setSubmitting(true)
    try {
      if (editingAccount) {
        await editAccount(editingAccount.id, formData)
      } else {
        await addAccount(formData)
      }
      resetForm()
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    if (window.confirm('确定删除此账户？相关的账单也会被删除。')) {
      await removeAccount(accountId)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">账户管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? '取消' : '添加账户'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h3 className="font-semibold">{editingAccount ? '编辑账户' : '添加账户'}</h3>

          <div>
            <label className="mb-1 block text-sm">账户名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="如：工商银行"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">类型</label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="cash">现金</option>
                <option value="bank">银行卡</option>
                <option value="credit">信用卡</option>
                <option value="investment">投资账户</option>
                <option value="ewallet">电子钱包</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">货币</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="CNY">CNY</option>
                <option value="USD">USD</option>
                <option value="HKD">HKD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm">初始余额</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border bg-background px-8 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">图标 (Emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="如：🏦"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">颜色</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-full rounded-lg border bg-background"
              />
            </div>
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? '保存中...' : editingAccount ? '更新' : '创建'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border bg-background px-4 py-2 text-sm hover:bg-secondary"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* Account List */}
      {accounts.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <p>暂无账户，点击上方"添加账户"开始</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
