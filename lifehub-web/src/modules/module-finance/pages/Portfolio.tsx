import { useEffect, useState } from 'react'
import { useAssetStore } from '../stores/assetStore'
import { AssetWithProfit } from '../api/financeApi'
import AssetPieChart from '../components/AssetPieChart'
import { LoadingSpinner } from '@/base/components/LoadingSpinner'

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: '股票',
  fund: '基金',
  bond: '债券',
  crypto: '加密货币',
  real_estate: '房产',
}

const ASSET_TYPE_COLORS: Record<string, string> = {
  stock: '#6366f1',
  fund: '#22c55e',
  bond: '#f59e0b',
  crypto: '#ef4444',
  real_estate: '#3b82f6',
}

export default function PortfolioPage() {
  const { assets, portfolioSummary, loading, error, loadAssets, loadPortfolioSummary, addAsset, editAsset, removeAsset, updatePrice } = useAssetStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [priceUpdateId, setPriceUpdateId] = useState<string | null>(null)
  const [priceValue, setPriceValue] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'fund' as string,
    code: '',
    hold_amount: 0,
    cost_price: 0,
    current_price: 0,
    currency: 'CNY',
    purchase_date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const summary = portfolioSummary
  const profitAssets = (assets as AssetWithProfit[]).filter((a) => a.profit !== undefined)

  useEffect(() => {
    loadAssets({ withProfit: true })
    loadPortfolioSummary()
  }, [])

  const resetForm = () => {
    setFormData({ name: '', asset_type: 'fund', code: '', hold_amount: 0, cost_price: 0, current_price: 0, currency: 'CNY', purchase_date: '' })
    setFormError('')
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (asset: any) => {
    setEditingId(asset.id)
    setFormData({
      name: asset.name,
      asset_type: asset.asset_type,
      code: asset.code || '',
      hold_amount: asset.hold_amount,
      cost_price: asset.cost_price,
      current_price: asset.current_price,
      currency: asset.currency,
      purchase_date: asset.purchase_date || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('请输入资产名称')
      return
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await editAsset(editingId, formData)
      } else {
        await addAsset(formData)
      }
      resetForm()
      loadAssets({ withProfit: true })
      loadPortfolioSummary()
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (assetId: string) => {
    if (window.confirm('确定删除此资产？相关的定投计划也会被删除。')) {
      await removeAsset(assetId)
      loadPortfolioSummary()
    }
  }

  const handlePriceUpdate = async (assetId: string) => {
    const price = parseFloat(priceValue)
    if (isNaN(price) || price < 0) return
    await updatePrice(assetId, price)
    setPriceUpdateId(null)
    setPriceValue('')
    loadPortfolioSummary()
  }

  if (loading && !summary) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">持仓管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? '取消' : '添加资产'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Portfolio Summary */}
      {summary && summary.total_value > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">总成本</p>
            <p className="text-xl font-bold">¥{summary.total_cost.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">总市值</p>
            <p className="text-xl font-bold">¥{summary.total_value.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">总盈亏</p>
            <p className={`text-xl font-bold ${summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.total_profit >= 0 ? '+' : ''}¥{summary.total_profit.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">收益率</p>
            <p className={`text-xl font-bold ${summary.total_profit_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.total_profit_percentage >= 0 ? '+' : ''}{summary.total_profit_percentage.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Pie Chart & Type Summary */}
      {profitAssets.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">资产配置</h3>
            <AssetPieChart assets={profitAssets} />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 font-semibold">分类汇总</h3>
            {summary?.type_summary?.map((ts: any) => (
              <div key={ts.asset_type} className="mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ASSET_TYPE_COLORS[ts.asset_type] || '#94a3b8' }} />
                  <span>{ASSET_TYPE_LABELS[ts.asset_type] || ts.asset_type}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">¥{ts.total_value.toLocaleString()}</span>
                  <span className={`ml-2 ${ts.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ts.profit >= 0 ? '+' : ''}{((ts.profit / (ts.total_cost || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset List */}
      <div className="space-y-3">
        {(assets as AssetWithProfit[]).map((asset) => (
          <div key={asset.id} className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{asset.name}</span>
                  {asset.code && <span className="text-xs text-muted-foreground">({asset.code})</span>}
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                    {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  持有 {asset.hold_amount} 份 · 成本价 ¥{asset.cost_price} · 现价 ¥{asset.current_price}
                </p>
              </div>
              {asset.profit !== undefined && (
                <div className="text-right">
                  <p className={`font-semibold ${asset.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {asset.profit >= 0 ? '+' : ''}¥{asset.profit.toLocaleString()}
                  </p>
                  <p className={`text-sm ${asset.profit_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {asset.profit_percentage >= 0 ? '+' : ''}{asset.profit_percentage.toFixed(2)}%
                  </p>
                </div>
              )}
            </div>

            {/* Quick price update */}
            {priceUpdateId === asset.id ? (
              <div className="mt-2 flex items-center gap-2 border-t pt-2">
                <input
                  type="number"
                  step="0.0001"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="flex-1 rounded-lg border bg-background px-3 py-1 text-sm"
                  placeholder="输入新价格"
                  autoFocus
                />
                <button
                  onClick={() => handlePriceUpdate(asset.id)}
                  className="rounded bg-primary px-3 py-1 text-xs text-white"
                >
                  确认
                </button>
                <button
                  onClick={() => setPriceUpdateId(null)}
                  className="rounded border px-3 py-1 text-xs"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="mt-2 flex justify-end gap-2 border-t pt-1">
                <button onClick={() => { setPriceUpdateId(asset.id); setPriceValue(asset.current_price.toString()) }} className="text-xs text-blue-600 hover:underline">
                  更新价格
                </button>
                <button onClick={() => handleEdit(asset)} className="text-xs text-blue-600 hover:underline">
                  编辑
                </button>
                <button onClick={() => handleDelete(asset.id)} className="text-xs text-red-600 hover:underline">
                  删除
                </button>
              </div>
            )}
          </div>
        ))}

        {assets.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            <p>暂无持仓，点击"添加资产"开始</p>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h3 className="font-semibold">{editingId ? '编辑资产' : '添加资产'}</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">资产名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="如：沪深300ETF"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">类型</label>
              <select
                value={formData.asset_type}
                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="stock">股票</option>
                <option value="fund">基金</option>
                <option value="bond">债券</option>
                <option value="crypto">加密货币</option>
                <option value="real_estate">房产</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">代码</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="可选"
              />
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm">持有数量</label>
              <input
                type="number"
                step="0.0001"
                value={formData.hold_amount}
                onChange={(e) => setFormData({ ...formData, hold_amount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">成本价</label>
              <input
                type="number"
                step="0.0001"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">当前价</label>
              <input
                type="number"
                step="0.0001"
                value={formData.current_price}
                onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm">购买日期</label>
            <input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
