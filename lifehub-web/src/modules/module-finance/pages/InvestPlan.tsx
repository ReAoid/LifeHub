import { useEffect, useState } from 'react'
import { useInvestPlanStore } from '../stores/investPlanStore'
import { useAssetStore } from '../stores/assetStore'
import { InvestPlanItem } from '../api/financeApi'
import { LoadingSpinner } from '@/base/components/LoadingSpinner'

const FREQ_LABELS: Record<string, string> = {
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月',
}

export default function InvestPlanPage() {
  const { plans, loading, error, loadPlans, addPlan, editPlan, removePlan, checkDue, duePlans } = useInvestPlanStore()
  const { assets, loadAssets } = useAssetStore()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    asset_id: '',
    amount: 0,
    frequency: 'monthly' as string,
    next_date: new Date().toISOString().split('T')[0],
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadPlans()
    loadAssets()
  }, [])

  const resetForm = () => {
    setFormData({ name: '', asset_id: '', amount: 0, frequency: 'monthly', next_date: new Date().toISOString().split('T')[0] })
    setFormError('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (plan: InvestPlanItem) => {
    setEditingId(plan.id)
    setFormData({
      name: plan.name,
      asset_id: plan.asset_id,
      amount: plan.amount,
      frequency: plan.frequency,
      next_date: plan.next_date,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('请输入计划名称')
      return
    }
    if (!formData.asset_id) {
      setFormError('请选择关联资产')
      return
    }
    if (formData.amount <= 0) {
      setFormError('请输入有效的定投金额')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await editPlan(editingId, formData)
      } else {
        await addPlan(formData)
      }
      resetForm()
      loadPlans()
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (window.confirm('确定删除此定投计划？')) {
      await removePlan(planId)
    }
  }

  const handleCheckDue = async () => {
    await checkDue()
    loadPlans()
  }

  const toggleActive = async (plan: InvestPlanItem) => {
    await editPlan(plan.id, { is_active: !plan.is_active } as any)
    loadPlans()
  }

  const getNextDateStatus = (nextDate: string): { label: string; color: string } => {
    const today = new Date()
    const next = new Date(nextDate)
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diff < 0) return { label: '已到期', color: 'text-red-600 bg-red-50 dark:bg-red-950' }
    if (diff <= 3) return { label: `${diff}天后`, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' }
    if (diff <= 7) return { label: `${diff}天后`, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' }
    return { label: nextDate, color: 'text-muted-foreground' }
  }

  if (loading && plans.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">定投计划</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCheckDue}
            className="rounded-lg border bg-background px-3 py-2 text-sm hover:bg-secondary"
          >
            检查到期
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? '取消' : '添加计划'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Due plans notification */}
      {duePlans.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            已触发 {duePlans.length} 个到期定投，已自动创建提醒任务
          </p>
        </div>
      )}

      {/* Plan List */}
      <div className="space-y-3">
        {plans.map((plan) => {
          const asset = assets.find((a: any) => a.id === plan.asset_id)
          const nextStatus = getNextDateStatus(plan.next_date)
          return (
            <div
              key={plan.id}
              className={`rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md ${
                !plan.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                      {FREQ_LABELS[plan.frequency] || plan.frequency}
                    </span>
                    {!plan.is_active && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        已暂停
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    每期 ¥{plan.amount.toLocaleString()}
                    {asset ? ` · ${(asset as any).name}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    ¥{plan.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`inline-block rounded-full px-2 py-0.5 text-xs ${nextStatus.color}`}>
                    下次: {nextStatus.label}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-3 border-t pt-2">
                <button
                  onClick={() => toggleActive(plan)}
                  className={`text-xs ${plan.is_active ? 'text-amber-600' : 'text-green-600'} hover:underline`}
                >
                  {plan.is_active ? '暂停' : '启用'}
                </button>
                <button onClick={() => handleEdit(plan)} className="text-xs text-blue-600 hover:underline">
                  编辑
                </button>
                <button onClick={() => handleDelete(plan.id)} className="text-xs text-red-600 hover:underline">
                  删除
                </button>
              </div>
            </div>
          )
        })}

        {plans.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <p>暂无定投计划，点击"添加计划"开始</p>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h3 className="font-semibold">{editingId ? '编辑定投计划' : '添加定投计划'}</h3>

          <div>
            <label className="mb-1 block text-sm">计划名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="如：沪深300定投"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">关联资产</label>
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">选择资产</option>
              {assets.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name} ({a.code || a.asset_type})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">每期金额</label>
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
            <div>
              <label className="mb-1 block text-sm">频率</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="weekly">每周</option>
                <option value="biweekly">每两周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm">下次执行日期</label>
            <input
              type="date"
              value={formData.next_date}
              onChange={(e) => setFormData({ ...formData, next_date: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            />
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
