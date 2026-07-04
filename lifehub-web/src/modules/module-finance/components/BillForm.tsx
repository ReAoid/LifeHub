import { useState, useEffect } from 'react'
import { AccountItem, BillCreatePayload, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../api/financeApi'

interface BillFormProps {
  accounts: AccountItem[]
  initialData?: Partial<BillCreatePayload>
  onSubmit: (data: BillCreatePayload) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function BillForm({ accounts, initialData, onSubmit, onCancel, isSubmitting }: BillFormProps) {
  const [billType, setBillType] = useState<'income' | 'expense' | 'transfer'>(initialData?.bill_type || 'expense')
  const [accountId, setAccountId] = useState(initialData?.account_id || (accounts[0]?.id || ''))
  const [toAccountId, setToAccountId] = useState(initialData?.to_account_id || '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [category, setCategory] = useState(initialData?.category || '其他')
  const [description, setDescription] = useState(initialData?.description || '')
  const [billDate, setBillDate] = useState(initialData?.bill_date || new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')

  const categories = billType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!accountId) {
      setError('请选择账户')
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('请输入有效的金额')
      return
    }
    if (billType === 'transfer' && !toAccountId) {
      setError('转账请选择目标账户')
      return
    }
    if (billType === 'transfer' && toAccountId === accountId) {
      setError('转账账户和目标账户不能相同')
      return
    }

    await onSubmit({
      account_id: accountId,
      bill_type: billType,
      amount: numAmount,
      category,
      description: description || null,
      bill_date: billDate,
      to_account_id: billType === 'transfer' ? toAccountId : null,
    })
  }

  // Reset category when bill type changes
  useEffect(() => {
    if (!initialData?.category) {
      setCategory(billType === 'income' ? '工资' : '其他')
    }
  }, [billType, initialData])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bill Type */}
      <div className="flex gap-2">
        {(['expense', 'income', 'transfer'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setBillType(type)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              billType === type
                ? type === 'expense'
                  ? 'bg-red-500 text-white'
                  : type === 'income'
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 text-white'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {type === 'expense' ? '支出' : type === 'income' ? '收入' : '转账'}
          </button>
        ))}
      </div>

      {/* Account */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          {billType === 'transfer' ? '转出账户' : '账户'}
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          required
        >
          <option value="">选择账户</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} (¥{a.balance.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      {/* Transfer target account */}
      {billType === 'transfer' && (
        <div>
          <label className="mb-1 block text-sm font-medium">转入账户</label>
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">选择目标账户</option>
            {accounts.filter((a) => a.id !== accountId).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (¥{a.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Amount */}
      <div>
        <label className="mb-1 block text-sm font-medium">金额</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border bg-background px-8 py-2 text-sm"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-sm font-medium">分类</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="mb-1 block text-sm font-medium">日期</label>
        <input
          type="date"
          value={billDate}
          onChange={(e) => setBillDate(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-sm font-medium">备注</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          rows={2}
          placeholder="可选备注..."
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? '提交中...' : '确认'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          取消
        </button>
      </div>
    </form>
  )
}
