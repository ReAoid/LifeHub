import { AccountItem } from '../api/financeApi'

const typeLabels: Record<string, string> = {
  cash: '现金',
  bank: '银行卡',
  credit: '信用卡',
  investment: '投资账户',
  ewallet: '电子钱包',
}

const typeColors: Record<string, string> = {
  cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  bank: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  credit: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  investment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ewallet: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

interface AccountCardProps {
  account: AccountItem
  onEdit?: (account: AccountItem) => void
  onDelete?: (accountId: string) => void
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const isNegative = account.account_type === 'credit'
  const displayBalance = isNegative ? -account.balance : account.balance

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: account.color || '#6366f1' + '20', color: account.color || '#6366f1' }}
          >
            {account.icon ? (
              <span className="text-xl">{account.icon}</span>
            ) : (
              <span className="text-lg font-bold">{account.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{account.name}</h3>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[account.account_type] || 'bg-gray-100'}`}>
              {typeLabels[account.account_type] || account.account_type}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
            {isNegative ? '-' : ''}¥{displayBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">{account.currency}</p>
        </div>
      </div>
      {!account.is_active && (
        <p className="mt-2 text-xs text-amber-600">已禁用</p>
      )}
      {(onEdit || onDelete) && (
        <div className="mt-3 flex justify-end gap-2 border-t pt-2">
          {onEdit && (
            <button
              onClick={() => onEdit(account)}
              className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              编辑
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(account.id)}
              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              删除
            </button>
          )}
        </div>
      )}
    </div>
  )
}
