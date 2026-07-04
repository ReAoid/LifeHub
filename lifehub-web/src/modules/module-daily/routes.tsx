import { RouteObject } from 'react-router-dom'
import DailyHomePage from './pages/DailyHome'
import TaskListPage from './pages/TaskList'
import TaskDetailPage from './pages/TaskDetail'
import HabitTrackerPage from './pages/HabitTracker'
import GoalBoardPage from './pages/GoalBoard'
import CalendarViewPage from './pages/CalendarView'

const dailyRoutes: RouteObject[] = [
  {
    path: 'daily',
    element: <DailyHomePage />,
  },
  {
    path: 'daily/tasks',
    element: <TaskListPage />,
  },
  {
    path: 'daily/tasks/:taskId',
    element: <TaskDetailPage />,
  },
  {
    path: 'daily/habits',
    element: <HabitTrackerPage />,
  },
  {
    path: 'daily/goals',
    element: <GoalBoardPage />,
  },
  {
    path: 'daily/calendar',
    element: <CalendarViewPage />,
  },
]

export default dailyRoutes
