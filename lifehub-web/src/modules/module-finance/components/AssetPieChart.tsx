import { AssetWithProfit } from '../api/financeApi'

interface AssetPieChartProps {
  assets: AssetWithProfit[]
}

const TYPE_COLORS: Record<string, string> = {
  stock: '#6366f1',    // indigo
  fund: '#22c55e',     // green
  bond: '#f59e0b',     // amber
  crypto: '#ef4444',   // red
  real_estate: '#3b82f6', // blue
}

const TYPE_LABELS: Record<string, string> = {
  stock: '股票',
  fund: '基金',
  bond: '债券',
  crypto: '加密货币',
  real_estate: '房产',
}

export default function AssetPieChart({ assets }: AssetPieChartProps) {
  const totalValue = assets.reduce((sum, a) => sum + a.current_value, 0)

  if (totalValue === 0 || assets.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        暂无资产数据
      </div>
    )
  }

  // Calculate segments for a simple pie visualization using conic gradient
  const segments = assets.map((asset, index) => {
    const percentage = (asset.current_value / totalValue) * 100
    const color = TYPE_COLORS[asset.asset_type] || '#94a3b8'
    return { ...asset, percentage, color }
  })

  // Build conic gradient string
  let cumulativePercent = 0
  const gradientParts = segments.map((seg) => {
    const start = cumulativePercent
    const end = cumulativePercent + seg.percentage
    cumulativePercent = end
    return `${seg.color} ${start}% ${end}%`
  })
  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`

  return (
    <div className="space-y-4">
      {/* Pie chart */}
      <div className="flex justify-center">
        <div
          className="h-48 w-48 rounded-full"
          style={{ background: conicGradient }}
        />
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span>{seg.name}</span>
              <span className="text-xs text-muted-foreground">
                ({TYPE_LABELS[seg.asset_type] || seg.asset_type})
              </span>
            </div>
            <div className="text-right">
              <span className="font-medium">
                ¥{seg.current_value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                {seg.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between border-t pt-2 text-sm font-semibold">
        <span>合计</span>
        <span>¥{totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  )
}
