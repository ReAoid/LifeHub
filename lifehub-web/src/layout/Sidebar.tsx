import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/base/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Target,
  PieChart,
  Wallet,
  BookOpen,
  Settings,
  Tags,
  type LucideIcon,
  CheckSquare,
} from 'lucide-react'
import { useAuthStore } from '@/base/stores/authStore'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  module?: string
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Daily', href: '/daily', icon: Calendar, module: 'daily' },
  { title: 'Tasks', href: '/daily/tasks', icon: CheckSquare, module: 'daily' },
  { title: 'Habits', href: '/daily/habits', icon: Target, module: 'daily' },
  { title: 'Goals', href: '/daily/goals', icon: BookOpen, module: 'daily' },
  { title: 'Finance', href: '/finance', icon: PieChart, module: 'finance' },
  { title: 'Accounts', href: '/finance/accounts', icon: Wallet, module: 'finance' },
]

const bottomNavItems: NavItem[] = [
  { title: 'Tags', href: '/tags', icon: Tags },
  { title: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        {collapsed ? (
          <span className="text-xl font-bold text-primary">L</span>
        ) : (
          <span className="text-xl font-bold text-primary">LifeHub</span>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            title={item.title}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t p-2">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            title={item.title}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}
      </div>
    </aside>
  )
}
