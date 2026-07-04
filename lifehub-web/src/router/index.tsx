import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layout/AppLayout'
import DashboardPage from '@/base/pages/DashboardPage'
import TagsPage from '@/base/pages/TagsPage'
import SettingsPage from '@/base/pages/SettingsPage'
import { baseRoutes } from '@/base/router/baseRoutes'
import dailyRoutes from '@/modules/module-daily/routes'
import financeRoutes from '@/modules/module-finance/routes'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'tags', element: <TagsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      // Module daily routes
      ...dailyRoutes,
      // Module finance routes
      ...financeRoutes,
    ],
  },
  ...baseRoutes,
])

export default router
