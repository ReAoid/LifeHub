import { RouteObject } from 'react-router-dom'
import FinanceHomePage from './pages/FinanceHome'
import AccountListPage from './pages/AccountList'
import BillListPage from './pages/BillList'
import BudgetBoardPage from './pages/BudgetBoard'
import PortfolioPage from './pages/Portfolio'
import InvestPlanPage from './pages/InvestPlan'

const financeRoutes: RouteObject[] = [
  {
    path: 'finance',
    element: <FinanceHomePage />,
  },
  {
    path: 'finance/accounts',
    element: <AccountListPage />,
  },
  {
    path: 'finance/bills',
    element: <BillListPage />,
  },
  {
    path: 'finance/budgets',
    element: <BudgetBoardPage />,
  },
  {
    path: 'finance/portfolio',
    element: <PortfolioPage />,
  },
  {
    path: 'finance/invest-plans',
    element: <InvestPlanPage />,
  },
]

export default financeRoutes
