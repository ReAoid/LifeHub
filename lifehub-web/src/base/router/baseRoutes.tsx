import { RouteObject } from 'react-router-dom'
import LoginPage from '@/base/pages/LoginPage'
import RegisterPage from '@/base/pages/RegisterPage'
import NotFoundPage from '@/base/pages/NotFoundPage'

export const baseRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
