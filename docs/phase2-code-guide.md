# LifeHub Phase 2 — module_daily 日常计划模块 代码导读

> 本文档介绍 LifeHub Phase 2 module_daily 的代码架构、模块职责和关键设计思路。

---

## 一、整体架构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React)                                │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  module-daily / pages                                                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ DailyHome│ │ TaskList │ │TaskDetail│ │ Habit-   │ │ GoalBoard  │  │  │
│  │  │ 概览页    │ │ 任务列表  │ │ 任务详情  │ │ Tracker  │ │ 目标看板    │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │ CalendarView 日历视图                                           │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                           ↕ Zustand Stores                             │  │
│  │  ┌────────────┐ ┌─────────────┐ ┌────────────┐                        │  │
│  │  │ taskStore  │ │ habitStore  │ │ goalStore  │                        │  │
│  │  └────────────┘ └─────────────┘ └────────────┘                        │  │
│  │                           ↕ dailyApi.ts                               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                ↕ axios + JWT                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                              Backend (FastAPI)                               │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  module_daily                                                         │  │
│  │                                                                       │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │  │
│  │  │ models.py        │  │ schemas.py       │  │ services.py        │  │  │
│  │  │ ─ Task           │  │ ─ TaskCreate/    │  │ ─ TaskService      │  │  │
│  │  │ ─ Habit          │  │   Update/Response │  │   (CRUD + reorder) │  │  │
│  │  │ ─ HabitLog       │  │ ─ HabitCreate/   │  │ ─ HabitService     │  │  │
│  │  │ ─ Goal           │  │   Update/Response │  │   (CRUD + streak)  │  │  │
│  │  │                  │  │ ─ HabitLogCreate/ │  │ ─ HabitLogService  │  │  │
│  │  │                  │  │   Update/Response │  │   (check-in)       │  │  │
│  │  │                  │  │ ─ GoalCreate/     │  │ ─ GoalService      │  │  │
│  │  │                  │  │   Update/Response │  │   (CRUD + progress) │  │  │
│  │  └──────────────────┘  └──────────────────┘  └────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                           │  │
│  │  │ api.py           │  │ events.py        │                           │  │
│  │  │ 17 个 REST 接口   │  │ 跨模块事件处理     │                           │  │
│  │  │ JWT 鉴权          │  │ 定投到期→创建待办  │                           │  │
│  │  └──────────────────┘  └──────────────────┘                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                ↕ SQLAlchemy async                           │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  daily_tasks  │  daily_habits  │  daily_habit_logs  │  daily_goals    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、后端新增/修改文件

```
lifehub-backend/
├── alembic/
│   ├── env.py                                    ← 修改：导入 module_daily 模型
│   └── versions/module_daily/
│       └── 002_create_daily_tables.py            ← 新增：4 张业务表迁移脚本
│
├── app/modules/module_daily/
│   ├── __init__.py                               ← 不变：插件注册入口
│   ├── models.py                                 ← 重写：Task, Habit, HabitLog, Goal
│   ├── schemas.py                                ← 重写：12 个 Pydantic DTO
│   ├── services.py                               ← 重写：完整业务逻辑层
│   ├── api.py                                    ← 重写：17 个 REST 接口
│   └── events.py                                 ← 更新：跨模块事件处理
```

### 2.1 模型层 (`models.py`)

```python
# ─── Task 待办 ───
class Task(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "daily_tasks"

    user_id: Mapped[uuid.UUID]          # FK → User (逻辑外键)
    title: Mapped[str]                  # 标题 (200字)
    description: Mapped[str | None]     # 描述
    priority: Mapped[int]               # 1=P0 紧急重要, 2=P1, 3=P2, 4=P3
    status: Mapped[str]                 # todo / in_progress / done / cancelled
    due_date: Mapped[date | None]       # 截止日期
    due_time: Mapped[time | None]       # 截止时间
    parent_id: Mapped[uuid.UUID | None] # 父任务 ID (子任务嵌套)
    sort_order: Mapped[int]             # 排序序号
    is_recurring: Mapped[bool]          # 是否重复
    recur_rule: Mapped[dict | None]     # 重复规则 (JSONB)
    completed_at: Mapped[datetime | None] # 完成时间

# ─── Habit 习惯 ───
class Habit(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "daily_habits"

    user_id: Mapped[uuid.UUID]
    name: Mapped[str]                   # 习惯名
    description: Mapped[str | None]
    frequency: Mapped[str]              # daily / weekly / monthly / custom
    target_count: Mapped[int]           # 每日/周/月目标次数
    icon: Mapped[str | None]            # 图标 emoji
    color: Mapped[str | None]           # 颜色 #RRGGBB
    start_date: Mapped[date]            # 开始日期
    is_active: Mapped[bool]             # 是否启用
    logs: Mapped[list[HabitLog]]        # ↕ 一对多关联

# ─── HabitLog 打卡记录 ───
class HabitLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "daily_habit_logs"

    habit_id: Mapped[uuid.UUID]         # FK → Habit
    log_date: Mapped[date]              # 打卡日期
    count: Mapped[int]                  # 当日完成次数
    note: Mapped[str | None]            # 备注
    habit: Mapped[Habit]                # ↕ 多对一关联

# ─── Goal 目标 ───
class Goal(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "daily_goals"

    user_id: Mapped[uuid.UUID]
    title: Mapped[str]                  # 目标标题
    description: Mapped[str | None]
    goal_type: Mapped[str]              # annual / quarterly / monthly / weekly
    target_value: Mapped[float]         # 目标值
    current_value: Mapped[float]        # 当前值
    unit: Mapped[str | None]            # 单位 (次/小时/元)
    start_date: Mapped[date]            # 开始日期
    end_date: Mapped[date | None]       # 截止日期
    status: Mapped[str]                 # active / completed / abandoned
    progress: Mapped[float | None]      # 进度百分比 (0.00~100.00)
```

### 2.2 业务逻辑层 (`services.py`)

#### TaskService 核心方法

| 方法 | 说明 | 关键逻辑 |
|------|------|---------|
| `list_tasks()` | 任务列表查询 | 支持 status/priority/due_date/parent_id 过滤，默认排除已完成的 |
| `get_task()` | 单任务查询 | 校验 user_id + task_id 归属 |
| `create_task()` | 创建任务 | 自动生成 UUID |
| `update_task()` | 更新任务 | status→done 时自动设置 `completed_at` |
| `delete_task()` | 删除任务 | **级联删除**所有子任务 |
| `reorder_tasks()` | 批量排序 | 按传入 ID 列表依次设置 sort_order |

#### HabitService 核心方法

| 方法 | 说明 | 关键逻辑 |
|------|------|---------|
| `get_streak()` | 连续天数计算 | 按日期降序扫描，计算当前连续天数 + 最长连续天数 |

**连续天数算法示例：**
```
today = 2026-07-04
logs dates = [07-04, 07-03, 07-02, 06-30, 06-29]

current_streak:
  ① 07-04 == today → current=1, checkDate=07-03
  ② 07-03 == checkDate → current=2, checkDate=07-02
  ③ 07-02 == checkDate → current=3, checkDate=07-01
  ④ 07-01 not in logs → break
  → current_streak = 3

longest_streak:
  sorted = [06-29, 06-30, 07-02, 07-03, 07-04]
  gap at 07-01 → longest = 3 (07-02 ~ 07-04) vs 2 (06-29 ~ 06-30)
  → longest_streak = 3
```

#### HabitLogService 核心方法

| 方法 | 说明 | 关键逻辑 |
|------|------|---------|
| `log_habit()` | 打卡 | 同一日期已打卡则累加 count，否则新建记录 |
| `list_logs()` | 日志列表 | 支持按 habit_id 和日期范围过滤 |

#### GoalService 核心方法

| 方法 | 说明 | 关键逻辑 |
|------|------|---------|
| `create_goal()` | 创建目标 | 自动计算初始 progress = current/target × 100 |
| `update_goal()` | 更新目标 | 变更 current/target 时自动重算 progress |
| `update_progress()` | 手动更新进度 | progress ≥ 100% 时自动标记 status = "completed" |
| `_calculate_progress()` | 进度计算 | current/target × 100，上限 100%，保留两位小数 |

### 2.3 API 路由 (`api.py`) — 17 个接口

```
# ─── Tasks ───
GET    /api/daily/tasks                   # 任务列表 (支持 status/priority/dueDate/includeDone)
GET    /api/daily/tasks/{id}              # 任务详情
POST   /api/daily/tasks                   # 创建任务         → 201
PUT    /api/daily/tasks/{id}              # 更新任务
DELETE /api/daily/tasks/{id}              # 删除任务 (含子任务)
PUT    /api/daily/tasks/reorder           # 批量排序
GET    /api/daily/tasks/{id}/subtasks     # 子任务列表

# ─── Habits ───
GET    /api/daily/habits                  # 习惯列表 (支持 isActive)
GET    /api/daily/habits/{id}             # 习惯详情
POST   /api/daily/habits                  # 创建习惯         → 201
PUT    /api/daily/habits/{id}             # 更新习惯
DELETE /api/daily/habits/{id}             # 删除习惯 (级联删除打卡记录)
GET    /api/daily/habits/{id}/streak      # 连续天数统计

# ─── Habit Logs ───
GET    /api/daily/habit-logs              # 打卡记录列表 (支持 habitId/dateFrom/dateTo)
POST   /api/daily/habit-logs              # 打卡             → 201
PUT    /api/daily/habit-logs/{id}         # 更新打卡记录
DELETE /api/daily/habit-logs/{id}         # 删除打卡记录

# ─── Goals ───
GET    /api/daily/goals                   # 目标列表 (支持 status/goalType)
GET    /api/daily/goals/{id}              # 目标详情
POST   /api/daily/goals                   # 创建目标         → 201
PUT    /api/daily/goals/{id}              # 更新目标
DELETE /api/daily/goals/{id}              # 删除目标
PUT    /api/daily/goals/{id}/progress     # 更新进度值
```

### 2.4 事件处理 (`events.py`)

```python
# 订阅: InvestPlanDueEvent (由 module_finance 发布)
# 动作: 自动创建一条待办提醒任务

event_bus.subscribe("InvestPlanDueEvent", handle_invest_plan_due)

# 数据格式:
# {
#   "user_id": "uuid",
#   "plan_name": "定投计划A",
#   "amount": 1000.00,
#   "next_date": "2026-07-04"
# }

# 效果: 生成一条 P1 优先级待办 →
#   "【定投提醒】定投计划A - ¥1000"
```

### 2.5 Alembic 迁移 (`002_create_daily_tables.py`)

```python
# Branch: module_daily (独立分支)
# Depends: base (依赖底座迁移)
# Tables: daily_tasks, daily_habits, daily_habit_logs, daily_goals

# 运行迁移:
alembic upgrade head

# 回滚:
alembic downgrade -1
```

---

## 三、前端新增文件

```
lifehub-web/src/modules/module-daily/
├── routes.tsx                        # 6 个子路由
├── api/
│   └── dailyApi.ts                   # 24 个 API 函数 + 类型定义
├── stores/
│   ├── taskStore.ts                  # 任务状态管理
│   ├── habitStore.ts                 # 习惯状态管理
│   └── goalStore.ts                  # 目标状态管理
└── pages/
    ├── DailyHome.tsx                 # 今日概览页
    ├── TaskList.tsx                  # 任务列表页
    ├── TaskDetail.tsx                # 任务详情页
    ├── HabitTracker.tsx              # 习惯打卡页
    ├── GoalBoard.tsx                 # 目标看板页
    └── CalendarView.tsx              # 日历视图页
```

### 3.1 路由配置 (`routes.tsx`)

```typescript
const dailyRoutes: RouteObject[] = [
  { path: 'daily',              element: <DailyHomePage /> },
  { path: 'daily/tasks',        element: <TaskListPage /> },
  { path: 'daily/tasks/:taskId', element: <TaskDetailPage /> },
  { path: 'daily/habits',       element: <HabitTrackerPage /> },
  { path: 'daily/goals',        element: <GoalBoardPage /> },
  { path: 'daily/calendar',     element: <CalendarViewPage /> },
]
```

### 3.2 API 封装 (`dailyApi.ts`)

```typescript
// 类型定义
TaskItem, HabitItem, HabitLogItem, HabitStreak, GoalItem
TaskCreatePayload, TaskUpdatePayload

// 任务 API (7个)
fetchTasks, fetchTask, createTask, updateTask, deleteTask, reorderTasks, fetchSubtasks

// 习惯 API (5个)
fetchHabits, fetchHabit, createHabit, updateHabit, deleteHabit, fetchHabitStreak

// 打卡 API (4个)
fetchHabitLogs, logHabit, updateHabitLog, deleteHabitLog

// 目标 API (6个)
fetchGoals, fetchGoal, createGoal, updateGoal, deleteGoal, updateGoalProgress
```

### 3.3 状态管理 (Zustand Stores)

```
taskStore:
  state:  tasks[], currentTask, loading, error
  actions: loadTasks, loadTask, addTask, editTask, removeTask, reorder

habitStore:
  state:  habits[], currentHabit, habitLogs[], streak, loading, error
  actions: loadHabits, loadHabit, addHabit, editHabit, removeHabit,
           loadStreak, loadLogs, checkIn, removeLog

goalStore:
  state:  goals[], currentGoal, loading, error
  actions: loadGoals, loadGoal, addGoal, editGoal, removeGoal, updateProgress
```

### 3.4 页面功能说明

| 页面 | 路由 | 功能 |
|------|------|------|
| **DailyHome** | `/daily` | 问候语 + 4 个统计卡片（今日待办/习惯/目标/日历）+ 今日任务列表 + 快速打卡 + 目标进度条 |
| **TaskList** | `/daily/tasks` | 创建表单（标题/优先级/日期）+ 状态过滤标签（全部/待办/进行中/已完成/已取消）+ 快速标记完成 + 删除 |
| **TaskDetail** | `/daily/tasks/:id` | 查看/编辑模式切换 + 状态快速切换（4 种状态按钮）+ 优先级/日期/时间编辑 + 删除 |
| **HabitTracker** | `/daily/habits` | 创建表单（名称/频率/目标次数/图标）+ 打卡按钮 + 7 天迷你日历 + 30 天打卡热力图 + 连续/最长天数统计 + 启用/暂停 |
| **GoalBoard** | `/daily/goals` | 创建表单（类型/目标值/单位/截止日期）+ 类型过滤 + 进度条可视化 + 更新进度（内联编辑）+ 标记完成/放弃 |
| **CalendarView** | `/daily/calendar` | 月历导航 + 任务标记点（颜色区分状态）+ 逾期高亮 + 点击查看日任务详情 + 侧面板任务列表 |

---

## 四、关键设计详解

### 4.1 插件机制集成

```
启动流程:
  ① main.py 启动
  ② PluginLoader 扫描 app/modules/
  ③ 读取 .env PLUGIN_DAILY_ENABLE=true
  ④ import app.modules.module_daily
  ⑤ 读取 plugin 对象 (Plugin descriptor)
  ⑥ 注册模型 (models.py) → Base.metadata
  ⑦ 挂载路由 (api.py) → /api/daily/*
  ⑧ 订阅事件 (events.py) → InvestPlanDueEvent

插件注册对象 (__init__.py):
  plugin = Plugin(
      name="module_daily",
      router_prefix="/api/daily",
      router_module="app.modules.module_daily.api",
      models=["app.modules.module_daily.models"],
      events_subscribe=["InvestPlanDueEvent"],
  )
```

### 4.2 跨模块事件联动

```
module_finance (Phase 3)          module_daily
       │                               │
       │  InvestPlanDueEvent            │
       │  {user_id, plan_name,          │
       │   amount, next_date}           │
       │                               │
       │ ──── Redis Pub/Sub ────────►  │
       │                               │
       │                          handle_invest_plan_due()
       │                               │
       │                          CREATE Task(
       │                            title="【定投提醒】...",
       │                            priority=2,
       │                            due_date=next_date
       │                          )
       │                               │
       │  ✅ 零 import 耦合              │
```

### 4.3 子任务机制

```
Task(parent_id = null)
    ├── Subtask A (parent_id = Task.id)
    ├── Subtask B (parent_id = Task.id)
    └── Subtask C (parent_id = Task.id)

删除父任务 → 自动 DELETE 所有子任务 (services.py delete_task)
查询子任务 → GET /api/daily/tasks/{id}/subtasks
```

### 4.4 优先级体系

| 值 | 标签 | 说明 | 前端颜色 |
|----|------|------|---------|
| 1 | P0 | 紧急重要 🔴 | `bg-red-500` |
| 2 | P1 | 重要不紧急 🟠 | `bg-orange-500` |
| 3 | P2 | 紧急不重要 🔵 | `bg-blue-500` |
| 4 | P3 | 普通 ⚪ | `bg-gray-400` |

### 4.5 目标进度自动计算

```python
def _calculate_progress(current_value, target_value):
    if target_value == 0:
        return Decimal("0.00")
    progress = (current_value / target_value) * 100
    return Decimal(str(round(min(progress, 100), 2)))

# 场景: 目标 "每月跑步 100 公里"，已跑 45 公里
# → progress = 45.00%

# 场景: 目标值更新为 200，当前值不变
# → progress 自动重算

# 场景: progress ≥ 100% → status 自动变为 "completed"
```

---

## 五、数据库表关系

```
                    ┌─────────────────────────────────────┐
                    │              users (base)            │
                    │  id (UUID PK)  username  email       │
                    └─────────────────────────────────────┘
                               │         │         │
               ┌───────────────┘         │         └───────────────┐
               ▼                         ▼                         ▼
  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
  │    daily_tasks       │  │    daily_habits       │  │    daily_goals       │
  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
  │ id (UUID PK)         │  │ id (UUID PK)         │  │ id (UUID PK)         │
  │ user_id              │  │ user_id              │  │ user_id              │
  │ title                │  │ name                 │  │ title                │
  │ priority (1-4)      │  │ frequency            │  │ goal_type            │
  │ status               │  │ target_count         │  │ target_value         │
  │ due_date             │  │ icon / color         │  │ current_value        │
  │ due_time             │  │ start_date           │  │ unit                 │
  │ parent_id (自引用)   │  │ is_active            │  │ start_date/end_date  │
  │ sort_order           │  │                      │  │ status               │
  │ is_recurring         │  └──────────┬───────────┘  │ progress             │
  │ recur_rule (JSON)    │             │              └──────────────────────┘
  │ completed_at         │             │  FK
  └──────────────────────┘             ▼
                    ┌──────────────────────────┐
                    │    daily_habit_logs       │
                    ├──────────────────────────┤
                    │ id (UUID PK)             │
                    │ habit_id (FK)            │
                    │ log_date                 │
                    │ count                    │
                    │ note                     │
                    └──────────────────────────┘
```

---

## 六、启动与测试

```bash
# 1. 启动后端
cd lifehub-backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. 启动前端
cd lifehub-web
npm run dev

# 3. 访问
# Swagger: http://localhost:8000/docs
# 前端:   http://localhost:5173
```

### API 测试示例

```bash
# 1. 注册用户
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@lifehub.app","password":"demo123"}'

# 2. 登录获取 Token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")

# 3. 创建任务
curl -X POST http://localhost:8000/api/daily/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"完成Phase 2文档","priority":1,"due_date":"2026-07-05"}'

# 4. 创建子任务
curl -X POST http://localhost:8000/api/daily/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"写代码导读","priority":2,"parent_id":"<父任务ID>"}'

# 5. 创建习惯
curl -X POST http://localhost:8000/api/daily/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"晨跑","frequency":"daily","target_count":1,"icon":"🏃","color":"#6366f1"}'

# 6. 打卡
curl -X POST http://localhost:8000/api/daily/habit-logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"habit_id":"<习惯ID>","count":1}'

# 7. 查看连续天数
curl http://localhost:8000/api/daily/habits/<习惯ID>/streak \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool

# 8. 创建目标
curl -X POST http://localhost:8000/api/daily/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"月度阅读4本书","goal_type":"monthly","target_value":4,"unit":"本","end_date":"2026-07-31"}'

# 9. 更新进度
curl -X PUT "http://localhost:8000/api/daily/goals/<目标ID>/progress?currentValue=2" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 七、Phase 2 验收标准对照

| 标准 | 状态 | 说明 |
|------|------|------|
| Task / Habit / HabitLog / Goal 模型 + 迁移 | ✅ | 4 张表，Alembic 迁移脚本就绪 |
| Task CRUD 接口（含子任务、排序） | ✅ | 7 个接口，支持子任务嵌套和批量排序 |
| Habit + HabitLog CRUD 接口（含打卡、连续天数） | ✅ | 连续天数算法，自动去重打卡 |
| Goal CRUD 接口（含进度计算） | ✅ | progress 自动计算，>=100% 自动完成 |
| 前端 DailyHome 今日概览页 | ✅ | 统计卡片 + 今日任务 + 快速打卡 + 目标进度 |
| 前端 TaskList + TaskDetail 页 | ✅ | 创建/过滤/编辑/详情/状态切换 |
| 前端 HabitTracker 打卡页 | ✅ | 30 天热力图 + 连续天数 + 图标选择 |
| 前端 GoalBoard 目标看板 | ✅ | 进度条 + 内联更新 + 类型过滤 |
| 前端 CalendarView 日历视图 | ✅ | 月历 + 任务标记 + 日详情面板 |
| 跨模块事件联动 | ✅ | 定投到期 → 自动生成待办提醒 |
| 插件系统集成 | ✅ | PluginLoader 自动发现注册 |

---

## 八、技术要点备忘

### 8.1 SQLite JSONB 兼容
```python
# models.py 中使用 JSONB 类型
# SQLite 通过 sqlalchemy.JSON 兼容（aiosqlite 自动处理）
# 迁移到 PostgreSQL 后无需修改代码
recur_rule: Mapped[dict | None] = mapped_column(JSONB, default=None)
```

### 8.2 前端 Axios 路径对齐
```
后端前缀: /api/daily/tasks
前端 baseURL: /api (client.ts)
前端调用: apiClient.get('/daily/tasks')
最终请求: GET /api/daily/tasks ✅
```

### 8.3 侧边栏菜单
```typescript
// Sidebar.tsx 注册了 Daily 菜单组
// Daily → /daily (概览)
// Tasks → /daily/tasks
// Habits → /daily/habits
// Goals → /daily/goals
// 路由自动从 router/index.tsx 聚合
```

### 8.4 与 Phase 3 的衔接
```
module_daily 当前事件订阅:
  - InvestPlanDueEvent (由 module_finance 发布)

module_daily 可发布的事件（待 Phase 3 使用）:
  - TaskDueReminderEvent (任务到期提醒)
  - GoalCompletedEvent (目标完成)

无需修改 module_daily 现有代码，
module_finance 直接订阅即可。
```
