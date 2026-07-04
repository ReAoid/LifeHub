import apiClient from '@/base/api/client'
import { ApiResponse } from '@/base/api/types'

// ==================== Shared Constants ====================

export const EXPENSE_CATEGORIES = [
  '餐饮', '交通', '购物', '居住', '娱乐', '教育', '医疗', '通讯',
  '服饰', '美妆', '社交', '运动', '旅行', '宠物', '数码', '其他',
] as const

export const INCOME_CATEGORIES = [
  '工资', '奖金', '投资', '兼职', '理财', '红包', '退款', '其他',
] as const

// ==================== Types ====================

export interface AccountItem {
  id: string
  user_id: string
  name: string
  account_type: 'cash' | 'bank' | 'credit' | 'investment' | 'ewallet'
  currency: string
  balance: number
  icon: string | null
  color: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BillItem {
  id: string
  user_id: string
  account_id: string
  bill_type: 'income' | 'expense' | 'transfer'
  amount: number
  category: string
  description: string | null
  bill_date: string
  to_account_id: string | null
  created_at: string
  updated_at: string
}

export interface BillCreatePayload {
  account_id: string
  bill_type: 'income' | 'expense' | 'transfer'
  amount: number
  category: string
  description?: string | null
  bill_date?: string | null
  to_account_id?: string | null
}

export interface BudgetItem {
  id: string
  user_id: string
  category: string
  amount: number
  period: 'monthly' | 'yearly'
  year: number
  month: number | null
  created_at: string
  updated_at: string
}

export interface BudgetWithSpending extends BudgetItem {
  spent: number
  remaining: number
  percentage: number
  is_over_budget: boolean
}

export interface AssetItem {
  id: string
  user_id: string
  name: string
  asset_type: 'stock' | 'fund' | 'bond' | 'crypto' | 'real_estate'
  code: string | null
  hold_amount: number
  cost_price: number
  current_price: number
  currency: string
  purchase_date: string | null
  created_at: string
  updated_at: string
}

export interface AssetWithProfit extends AssetItem {
  cost_value: number
  current_value: number
  profit: number
  profit_percentage: number
}

export interface InvestPlanItem {
  id: string
  user_id: string
  name: string
  asset_id: string
  amount: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  next_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PortfolioSummary {
  total_cost: number
  total_value: number
  total_profit: number
  total_profit_percentage: number
  assets: AssetWithProfit[]
  type_summary: { asset_type: string; total_value: number; total_cost: number; profit: number }[]
}

export interface MonthlyBudgetOverview {
  year: number
  month: number
  total_budget: number
  total_spent: number
  uncategorized_spent: number
  budgets: BudgetWithSpending[]
}

export interface FinanceOverview {
  net_worth: { total: number; assets: number; liabilities: number }
  monthly_summary: { income: number; expense: number; net: number }
  portfolio_summary: { total_value: number; total_profit: number; total_profit_percentage: number }
  accounts: { id: string; name: string; account_type: string; balance: number; currency: string; color: string | null; icon: string | null }[]
}

export interface BillSummary {
  income: number
  expense: number
  net: number
  categories: { category: string; amount: number }[]
}

export interface PaginatedBills {
  items: BillItem[]
  total: number
  limit: number
  offset: number
}

// ==================== Account APIs ====================

export async function fetchAccounts(isActive?: boolean): Promise<AccountItem[]> {
  const response = await apiClient.get<ApiResponse<AccountItem[]>>('/finance/accounts', {
    params: { isActive },
  })
  return response.data.data
}

export async function fetchAccount(accountId: string): Promise<AccountItem> {
  const response = await apiClient.get<ApiResponse<AccountItem>>(`/finance/accounts/${accountId}`)
  return response.data.data
}

export async function createAccount(data: {
  name: string
  account_type?: string
  currency?: string
  balance?: number
  icon?: string
  color?: string
}): Promise<AccountItem> {
  const response = await apiClient.post<ApiResponse<AccountItem>>('/finance/accounts', data)
  return response.data.data
}

export async function updateAccount(
  accountId: string,
  data: Partial<{
    name: string
    account_type: string
    currency: string
    balance: number
    icon: string
    color: string
    is_active: boolean
  }>
): Promise<AccountItem> {
  const response = await apiClient.put<ApiResponse<AccountItem>>(`/finance/accounts/${accountId}`, data)
  return response.data.data
}

export async function deleteAccount(accountId: string): Promise<void> {
  await apiClient.delete(`/finance/accounts/${accountId}`)
}

export async function adjustBalance(accountId: string, amount: number): Promise<AccountItem> {
  const response = await apiClient.put<ApiResponse<AccountItem>>(
    `/finance/accounts/${accountId}/balance?amount=${amount}`
  )
  return response.data.data
}

// ==================== Bill APIs ====================

export async function fetchBills(params?: {
  accountId?: string
  billType?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}): Promise<PaginatedBills> {
  const response = await apiClient.get<ApiResponse<PaginatedBills>>('/finance/bills', { params })
  return response.data.data
}

export async function fetchBill(billId: string): Promise<BillItem> {
  const response = await apiClient.get<ApiResponse<BillItem>>(`/finance/bills/${billId}`)
  return response.data.data
}

export async function createBill(data: BillCreatePayload): Promise<BillItem> {
  const response = await apiClient.post<ApiResponse<BillItem>>('/finance/bills', data)
  return response.data.data
}

export async function updateBill(
  billId: string,
  data: Partial<BillCreatePayload>
): Promise<BillItem> {
  const response = await apiClient.put<ApiResponse<BillItem>>(`/finance/bills/${billId}`, data)
  return response.data.data
}

export async function deleteBill(billId: string): Promise<void> {
  await apiClient.delete(`/finance/bills/${billId}`)
}

export async function fetchBillCategories(): Promise<string[]> {
  const response = await apiClient.get<ApiResponse<string[]>>('/finance/bills/categories')
  return response.data.data
}

export async function fetchBillSummary(dateFrom: string, dateTo: string): Promise<BillSummary> {
  const response = await apiClient.get<ApiResponse<BillSummary>>('/finance/bills/summary', {
    params: { dateFrom, dateTo },
  })
  return response.data.data
}

// ==================== Budget APIs ====================

export async function fetchBudgets(params?: {
  period?: string
  year?: number
  month?: number
  withSpending?: boolean
}): Promise<BudgetItem[] | BudgetWithSpending[]> {
  const response = await apiClient.get<ApiResponse<BudgetItem[] | BudgetWithSpending[]>>('/finance/budgets', { params })
  return response.data.data
}

export async function fetchBudget(budgetId: string, withSpending?: boolean): Promise<BudgetItem | BudgetWithSpending> {
  const response = await apiClient.get<ApiResponse<BudgetItem | BudgetWithSpending>>(
    `/finance/budgets/${budgetId}`, { params: { withSpending } }
  )
  return response.data.data
}

export async function createBudget(data: {
  category: string
  amount: number
  period?: string
  year: number
  month?: number
}): Promise<BudgetItem> {
  const response = await apiClient.post<ApiResponse<BudgetItem>>('/finance/budgets', data)
  return response.data.data
}

export async function updateBudget(
  budgetId: string,
  data: Partial<{
    category: string
    amount: number
    period: string
    year: number
    month: number
  }>
): Promise<BudgetItem> {
  const response = await apiClient.put<ApiResponse<BudgetItem>>(`/finance/budgets/${budgetId}`, data)
  return response.data.data
}

export async function deleteBudget(budgetId: string): Promise<void> {
  await apiClient.delete(`/finance/budgets/${budgetId}`)
}

export async function fetchMonthlyOverview(year: number, month: number): Promise<MonthlyBudgetOverview> {
  const response = await apiClient.get<ApiResponse<MonthlyBudgetOverview>>(
    `/finance/budgets/monthly-overview`, { params: { year, month } }
  )
  return response.data.data
}

// ==================== Asset APIs ====================

export async function fetchAssets(params?: {
  assetType?: string
  withProfit?: boolean
}): Promise<AssetItem[] | AssetWithProfit[]> {
  const response = await apiClient.get<ApiResponse<AssetItem[] | AssetWithProfit[]>>('/finance/assets', { params })
  return response.data.data
}

export async function fetchAsset(assetId: string, withProfit?: boolean): Promise<AssetItem | AssetWithProfit> {
  const response = await apiClient.get<ApiResponse<AssetItem | AssetWithProfit>>(
    `/finance/assets/${assetId}`, { params: { withProfit } }
  )
  return response.data.data
}

export async function createAsset(data: {
  name: string
  asset_type: string
  code?: string
  hold_amount?: number
  cost_price?: number
  current_price?: number
  currency?: string
  purchase_date?: string
}): Promise<AssetItem> {
  const response = await apiClient.post<ApiResponse<AssetItem>>('/finance/assets', data)
  return response.data.data
}

export async function updateAsset(
  assetId: string,
  data: Partial<{
    name: string
    asset_type: string
    code: string
    hold_amount: number
    cost_price: number
    current_price: number
    currency: string
  }>
): Promise<AssetItem> {
  const response = await apiClient.put<ApiResponse<AssetItem>>(`/finance/assets/${assetId}`, data)
  return response.data.data
}

export async function deleteAsset(assetId: string): Promise<void> {
  await apiClient.delete(`/finance/assets/${assetId}`)
}

export async function updateAssetPrice(assetId: string, currentPrice: number): Promise<AssetItem> {
  const response = await apiClient.put<ApiResponse<AssetItem>>(
    `/finance/assets/${assetId}/price?currentPrice=${currentPrice}`
  )
  return response.data.data
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  const response = await apiClient.get<ApiResponse<PortfolioSummary>>('/finance/assets/portfolio/summary')
  return response.data.data
}

// ==================== Invest Plan APIs ====================

export async function fetchInvestPlans(isActive?: boolean): Promise<InvestPlanItem[]> {
  const response = await apiClient.get<ApiResponse<InvestPlanItem[]>>('/finance/invest-plans', {
    params: { isActive },
  })
  return response.data.data
}

export async function fetchInvestPlan(planId: string): Promise<InvestPlanItem> {
  const response = await apiClient.get<ApiResponse<InvestPlanItem>>(`/finance/invest-plans/${planId}`)
  return response.data.data
}

export async function createInvestPlan(data: {
  name: string
  asset_id: string
  amount: number
  frequency?: string
  next_date?: string
}): Promise<InvestPlanItem> {
  const response = await apiClient.post<ApiResponse<InvestPlanItem>>('/finance/invest-plans', data)
  return response.data.data
}

export async function updateInvestPlan(
  planId: string,
  data: Partial<{
    name: string
    asset_id: string
    amount: number
    frequency: string
    next_date: string
    is_active: boolean
  }>
): Promise<InvestPlanItem> {
  const response = await apiClient.put<ApiResponse<InvestPlanItem>>(`/finance/invest-plans/${planId}`, data)
  return response.data.data
}

export async function deleteInvestPlan(planId: string): Promise<void> {
  await apiClient.delete(`/finance/invest-plans/${planId}`)
}

export async function checkDuePlans(): Promise<{ plan_id: string; plan_name: string; amount: number; next_date: string }[]> {
  const response = await apiClient.post<ApiResponse<{ plan_id: string; plan_name: string; amount: number; next_date: string }[]>>(
    '/finance/invest-plans/check-due'
  )
  return response.data.data
}

// ==================== Overview API ====================

export async function fetchFinanceOverview(): Promise<FinanceOverview> {
  const response = await apiClient.get<ApiResponse<FinanceOverview>>('/finance/overview')
  return response.data.data
}
