# LifeHub — 开发计划

> 插件化个人生活管理中台 · Python FastAPI + React  
> 当前阶段：底座搭建 → module_daily → module_finance

---

## 一、项目定位

LifeHub 是一套**插拔式模块化**个人数据管理系统。核心思路：底座只做通用基础设施，业务全部以独立插件存在，按需启用、互不耦合。

**当前只开发两个插件：**
- `module_daily` — 日常计划（待办、日历、习惯打卡、目标追踪、提醒）
- `module_finance` — 资产投资（记账、账户、预算、持仓、定投、收益分析）

后续健身营养、兴趣收藏等直接新增插件目录，现有代码零修改。

---

## 二、确认技术栈

| 层 | 选型 | 备注 |
|---|---|---|
| 后端框架 | **FastAPI** (Python 3.12) | 异步、自动 OpenAPI、路由挂载天然适配插件化 |
| ORM | **SQLAlchemy 2.0** (async) | 声明式模型，按模块隔离 |
| 数据库 | **PostgreSQL 16** | JSONB 支持灵活扩展字段 |
| 缓存 / 事件总线 | **Redis** | 缓存 + Pub/Sub 实现模块解耦通信 |
| 迁移工具 | **Alembic** | 底座 + 各模块独立迁移脚本 |
| 鉴权 | **JWT** (python-jose) | 无状态，多端统一 |
| 包管理 | **Poetry** | 依赖锁定、虚拟环境管理 |
| 前端框架 | **React 18 + TypeScript + Vite** | |
| 状态管理 | **Zustand** | 轻量，base 全局 + 各模块独立 store |
| UI | **Shadcn UI + Tailwind CSS** | 现代、可定制、轻量 |
| 图表 | **Recharts** | 仪表盘趋势图 |
| 路由 | **React Router v6** | 自动扫描插件路由 |
| 部署 | **Docker Compose** | FastAPI + PostgreSQL + Redis + Nginx |

**暂不开发：** 移动端 Flutter（后续独立仓库接入）。

---

## 三、项目目录结构

### 3.1 仓库组织

```
LifeHub/
├── lifehub-backend/          # Python FastAPI 后端
├── lifehub-web/              # React 前端
├── docker/                   # 全局部署配置
├── docs/                     # 文档
├── DEVELOPMENT_PLAN.md       # 本文件
└── README.md
```

### 3.2 后端详细结构

```
lifehub-backend/
├── pyproject.toml                # Poetry 配置
├── poetry.lock
├── alembic.ini
├── alembic/
│   ├── versions/
│   │   ├── base/                 # 底座表迁移
│   │   ├── module_daily/         # 日常模块表迁移
│   │   └── module_finance/       # 资产模块表迁移
│   └── env.py
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI 入口：加载底座 + 扫描插件
│   ├── base/                     # ========== 底座层（零业务逻辑）==========
│   │   ├── __init__.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py         # 全局配置 Settings（pydantic-settings）
│   │   │   ├── plugin_loader.py  # 插件扫描、注册、路由挂载
│   │   │   ├── event_bus.py      # Redis Pub/Sub 事件总线
│   │   │   └── security.py       # JWT 生成/验证、密码哈希
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py        # async session 工厂
│   │   │   └── base_model.py     # SQLAlchemy declarative Base
│   │   ├── models/               # 底座数据模型
│   │   │   ├── __init__.py
│   │   │   ├── user.py           # User、UserProfile
│   │   │   ├── tag.py            # Tag、TagLink（全局标签体系）
│   │   │   ├── sync.py           # SyncLog（增量同步记录）
│   │   │   └── attachment.py     # 附件/文件引用
│   │   ├── api/                  # 底座路由
│   │   │   ├── __init__.py
│   │   │   ├── auth.py           # 注册/登录/刷新Token
│   │   │   ├── users.py          # 用户设置
│   │   │   ├── tags.py           # 标签 CRUD
│   │   │   └── sync.py           # 同步接口
│   │   ├── services/             # 底座服务
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── tag_service.py
│   │   │   └── sync_service.py
│   │   └── schemas/              # 底座 Pydantic Schema
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── user.py
│   │       └── tag.py
│   ├── modules/                  # ========== 业务插件层 ==========
│   │   ├── __init__.py
│   │   ├── module_daily/         # 日常计划插件
│   │   │   ├── __init__.py       # 插件注册入口
│   │   │   ├── models.py         # Task, Schedule, Habit, Goal
│   │   │   ├── schemas.py        # 请求/响应 DTO
│   │   │   ├── services.py       # 业务逻辑
│   │   │   ├── api.py            # 路由接口
│   │   │   └── events.py         # 事件订阅/发布
│   │   └── module_finance/       # 资产投资插件
│   │       ├── __init__.py       # 插件注册入口
│   │       ├── models.py         # Account, Bill, Budget, Asset, InvestPlan
│   │       ├── schemas.py
│   │       ├── services.py
│   │       ├── calculator.py     # 收益/占比计算工具
│   │       ├── api.py
│   │       └── events.py         # 定投到期等事件
│   ├── common/                   # ========== 全局通用 ==========
│   │   ├── __init__.py
│   │   ├── response.py           # 统一响应体
│   │   ├── exceptions.py         # 全局异常处理
│   │   └── deps.py               # 通用依赖注入（get_db, get_current_user）
│   └── extension/                # ========== 扩展层（未来）==========
│       ├── __init__.py
│       └── datasource/           # 股票行情、账单导入等
└── tests/
    ├── base/
    └── modules/
```

### 3.3 前端详细结构

```
lifehub-web/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── components.json              # shadcn/ui 配置
├── index.html
├── public/
└── src/
    ├── main.tsx                  # 入口
    ├── App.tsx                   # 根组件（加载底座 + 插件路由）
    ├── base/                     # ========== 前端底座 ==========
    │   ├── api/
    │   │   ├── client.ts         # axios 实例 + 拦截器 + JWT 刷新
    │   │   ├── auth.ts           # 登录/注册 API
    │   │   ├── tags.ts           # 标签 API
    │   │   └── sync.ts           # 同步 API
    │   ├── stores/
    │   │   ├── authStore.ts      # 用户登录态
    │   │   └── tagStore.ts       # 全局标签
    │   ├── router/
    │   │   └── baseRoutes.tsx    # 登录/注册/404 等基础路由
    │   ├── components/           # 全局通用组件
    │   │   ├── TagSelector.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   └── EmptyState.tsx
    │   ├── hooks/                # 通用 hooks
    │   │   ├── useAuth.ts
    │   │   └── useTags.ts
    │   └── lib/
    │       └── utils.ts
    ├── modules/                  # ========== 前端业务插件 ==========
    │   ├── module-daily/
    │   │   ├── api/
    │   │   │   └── dailyApi.ts   # 待办/习惯/目标等接口
    │   │   ├── stores/
    │   │   │   ├── taskStore.ts
    │   │   │   ├── habitStore.ts
    │   │   │   └── goalStore.ts
    │   │   ├── routes.tsx        # 插件子路由
    │   │   ├── pages/
    │   │   │   ├── DailyHome.tsx       # 今日概览
    │   │   │   ├── TaskList.tsx        # 待办列表
    │   │   │   ├── TaskDetail.tsx      # 待办详情
    │   │   │   ├── CalendarView.tsx    # 日历视图
    │   │   │   ├── HabitTracker.tsx    # 习惯打卡
    │   │   │   └── GoalBoard.tsx       # 目标看板
    │   │   └── components/
    │   │       ├── TaskCard.tsx
    │   │       ├── HabitStreak.tsx
    │   │       └── GoalProgress.tsx
    │   └── module-finance/
    │       ├── api/
    │       │   └── financeApi.ts
    │       ├── stores/
    │       │   ├── accountStore.ts
    │       │   ├── billStore.ts
    │       │   └── investStore.ts
    │       ├── routes.tsx
    │       ├── pages/
    │       │   ├── FinanceHome.tsx     # 资产总览
    │       │   ├── AccountList.tsx     # 账户管理
    │       │   ├── BillList.tsx        # 账单流水
    │       │   ├── BudgetBoard.tsx     # 预算看板
    │       │   ├── Portfolio.tsx       # 持仓管理
    │       │   └── InvestPlan.tsx      # 定投计划
    │       ├── components/
    │       │   ├── AccountCard.tsx
    │       │   ├── BillForm.tsx
    │       │   └── AssetPieChart.tsx
    │       └── utils/
    │           └── calculator.ts       # 前端离线计算
    ├── layout/                   # ========== 全局布局 ==========
    │   ├── AppLayout.tsx         # 主布局（侧边栏 + 内容区）
    │   ├── Sidebar.tsx           # 动态侧边栏（根据启用插件渲染菜单）
    │   └── Header.tsx            # 顶栏
    ├── router/
    │   └── index.tsx             # 路由聚合：baseRoutes + 扫描 modules/*/routes.tsx
    └── styles/
        ├── globals.css           # Tailwind + shadcn 基础样式
        └── shadcn/               # shadcn/ui 组件（由 CLI 生成）
```

---

## 四、插件机制核心设计

### 4.1 插件接口规范

每个业务模块在 `__init__.py` 中导出标准插件对象：

```python
# app/modules/module_daily/__init__.py
from app.base.core.plugin_loader import Plugin

plugin = Plugin(
    name="module_daily",
    version="0.1.0",
    router_prefix="/api/daily",      # 路由前缀
    router_module="app.modules.module_daily.api",
    models=["app.modules.module_daily.models"],  # 需注册的 ORM 模型
    events_subscribe=["InvestPlanDueEvent"],     # 订阅的事件列表
)
```

### 4.2 插件加载器流程

```
FastAPI 启动
    │
    ▼
读取 .env 插件开关（PLUGIN_DAILY_ENABLE=true）
    │
    ▼
扫描 app/modules/ 下所有目录
    │
    ├── 已启用 → import __init__.py → 注册路由 → 注册模型 → 订阅事件
    │
    └── 已禁用 → 跳过，对应路由 404
```

### 4.3 事件总线通信

```
┌──────────────┐     Redis Pub/Sub     ┌──────────────┐
│  module_finance │ ── InvestPlanDueEvent ──▶ │  module_daily  │
│  (定投到期)     │                           │  (生成待办提醒)  │
└──────────────┘                           └──────────────┘

• 发布方：只发事件，不关心谁消费
• 消费方：只订阅事件，不依赖发布方代码
• 两个模块 zero import 耦合
```

### 4.4 环境配置

```env
# .env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/lifehub
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 插件开关
PLUGIN_DAILY_ENABLE=true
PLUGIN_FINANCE_ENABLE=true
PLUGIN_HEALTH_ENABLE=false
PLUGIN_HOBBY_ENABLE=false
```

---

## 五、数据库设计

### 5.1 底座表（base）

#### User
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| username | VARCHAR(50) | 唯一 |
| email | VARCHAR(255) | 唯一 |
| hashed_password | VARCHAR(255) | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### Tag（全局标签）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| name | VARCHAR(50) | 标签名 |
| color | VARCHAR(7) | #RRGGBB |
| user_id | UUID | FK → User |
| created_at | TIMESTAMPTZ | |

#### TagLink（标签关联）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| tag_id | UUID | FK → Tag |
| target_type | VARCHAR(50) | 关联对象类型："task"/"bill"/"habit" 等 |
| target_id | UUID | 关联对象 ID |
| user_id | UUID | FK → User |

#### SyncLog（同步记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| device_id | VARCHAR(100) | 设备标识 |
| entity_type | VARCHAR(50) | 实体类型 |
| entity_id | UUID | 实体 ID |
| action | VARCHAR(20) | CREATE/UPDATE/DELETE |
| version | INTEGER | 乐观锁版本号 |
| synced_at | TIMESTAMPTZ | |

### 5.2 日常计划表（module_daily）

#### Task（待办）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| title | VARCHAR(200) | |
| description | TEXT | |
| priority | SMALLINT | 1-4（P0-P3） |
| status | VARCHAR(20) | todo / in_progress / done / cancelled |
| due_date | DATE | 截止日期 |
| due_time | TIME | 截止时间（可选） |
| parent_id | UUID | 父任务（子任务嵌套） |
| sort_order | INTEGER | 排序 |
| is_recurring | BOOLEAN | 是否重复 |
| recur_rule | JSONB | 重复规则（RRULE 格式） |
| completed_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### Habit（习惯）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| name | VARCHAR(100) | 习惯名 |
| description | TEXT | |
| frequency | VARCHAR(20) | daily / weekly / monthly / custom |
| target_count | INTEGER | 目标次数 |
| icon | VARCHAR(50) | 图标 |
| color | VARCHAR(7) | |
| start_date | DATE | |
| is_active | BOOLEAN | |

#### HabitLog（打卡记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| habit_id | UUID | FK → Habit |
| log_date | DATE | 打卡日期 |
| count | INTEGER | 当日完成次数 |
| note | TEXT | |
| created_at | TIMESTAMPTZ | |

#### Goal（目标）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| title | VARCHAR(200) | |
| description | TEXT | |
| goal_type | VARCHAR(30) | annual / quarterly / monthly |
| target_value | NUMERIC | 目标值 |
| current_value | NUMERIC | 当前值 |
| unit | VARCHAR(20) | 单位（次/小时/元等） |
| start_date | DATE | |
| end_date | DATE | |
| status | VARCHAR(20) | active / completed / abandoned |
| progress | NUMERIC(5,2) | 进度百分比 |

### 5.3 资产投资表（module_finance）

#### Account（账户）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| name | VARCHAR(100) | 账户名称 |
| account_type | VARCHAR(30) | cash / bank / credit / investment / ewallet |
| currency | VARCHAR(10) | CNY/USD 等 |
| balance | NUMERIC(15,2) | 当前余额 |
| icon | VARCHAR(50) | |
| color | VARCHAR(7) | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

#### Bill（账单）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| account_id | UUID | FK → Account |
| bill_type | VARCHAR(10) | income / expense / transfer |
| amount | NUMERIC(12,2) | 金额 |
| category | VARCHAR(50) | 分类：餐饮/交通/购物/投资等 |
| description | TEXT | |
| bill_date | DATE | |
| created_at | TIMESTAMPTZ | |

#### Budget（预算）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| category | VARCHAR(50) | 预算分类 |
| amount | NUMERIC(12,2) | 预算金额 |
| period | VARCHAR(10) | monthly / yearly |
| year | INTEGER | |
| month | INTEGER | 1-12（当 period=monthly） |

#### Asset（持仓资产）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| name | VARCHAR(100) | 资产名称 |
| asset_type | VARCHAR(20) | stock / fund / bond / crypto / real_estate |
| code | VARCHAR(20) | 代码（股票/基金代码） |
| hold_amount | NUMERIC(18,4) | 持仓数量 |
| cost_price | NUMERIC(12,4) | 成本价 |
| current_price | NUMERIC(12,4) | 当前价（可手动/自动更新） |
| currency | VARCHAR(10) | |
| purchase_date | DATE | |

#### InvestPlan（定投计划）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| name | VARCHAR(100) | |
| asset_id | UUID | FK → Asset |
| amount | NUMERIC(12,2) | 每期金额 |
| frequency | VARCHAR(10) | weekly / biweekly / monthly |
| next_date | DATE | 下次执行日 |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

---

## 六、统一 API 规范

### 6.1 响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

```json
{
  "code": 40001,
  "message": "Task not found",
  "data": null
}
```

### 6.2 错误码范围

| 范围 | 说明 |
|------|------|
| 0 | 成功 |
| 40000-40099 | 通用错误（参数校验、未授权等） |
| 40100-40199 | 用户模块 |
| 41000-41099 | 标签模块 |
| 42000-42099 | module_daily |
| 43000-43099 | module_finance |

### 6.3 路由前缀

| 模块 | 前缀 |
|------|------|
| 底座（认证/用户/标签） | `/api/auth/`, `/api/users/`, `/api/tags/` |
| 同步 | `/api/sync/` |
| module_daily | `/api/daily/tasks/`, `/api/daily/habits/`, `/api/daily/goals/` |
| module_finance | `/api/finance/accounts/`, `/api/finance/bills/`, `/api/finance/assets/`, `/api/finance/budgets/`, `/api/finance/invest-plans/` |

---

## 七、开发阶段

### Phase 1：底座搭建（预计 5-7 天）

**目标：** 跑通整个骨架，插件机制可验证

| 步骤 | 内容 |
|------|------|
| 1.1 | Poetry 初始化项目，`pyproject.toml` 依赖声明 |
| 1.2 | FastAPI 入口 + 基础配置 + 日志 |
| 1.3 | PostgreSQL 连接 + SQLAlchemy async session + Base Model |
| 1.4 | User 模型 + Alembic 初始迁移 |
| 1.5 | JWT 注册/登录/刷新 Token 接口 |
| 1.6 | `plugin_loader.py` 插件扫描与路由注册核心 |
| 1.7 | Docker Compose（FastAPI + PostgreSQL + Redis） |
| 1.8 | 前端 Vite + React + Tailwind + Shadcn UI 初始化 |
| 1.9 | 前端登录页 + 注册页 + 鉴权流程联调 |
| 1.10 | 前端 AppLayout 布局框架 + 侧边栏动态菜单 |
| 1.11 | Tag 标签模型 + CRUD（后端） |
| 1.12 | 全局事件总线骨架（Redis Pub/Sub） |

**验收标准：**
- 后端启动，访问 `/docs` 可以看到 Swagger
- 前端登录注册流程跑通
- 侧边栏根据插件开关动态渲染
- Docker Compose 一键启动

### Phase 2：module_daily 日常计划（预计 5-7 天）

| 步骤 | 内容 |
|------|------|
| 2.1 | Task / Habit / HabitLog / Goal 模型 + 迁移 |
| 2.2 | Task CRUD 接口（含子任务、排序、重复规则） |
| 2.3 | Habit + HabitLog CRUD 接口（含打卡、连续天数） |
| 2.4 | Goal CRUD 接口（含进度计算） |
| 2.5 | 前端 DailyHome 今日概览页 |
| 2.6 | 前端 TaskList + TaskDetail 页 |
| 2.7 | 前端 HabitTracker 打卡页 |
| 2.8 | 前端 GoalBoard 目标看板 |
| 2.9 | 前端 CalendarView 日历视图 |

**验收标准：**
- 完整待办增删改查 + 拖拽排序
- 习惯打卡含连续天数火焰图
- 目标进度实时更新
- 日历视图展示每日任务

### Phase 3：module_finance 资产投资（预计 7-9 天）

| 步骤 | 内容 |
|------|------|
| 3.1 | Account / Bill / Budget / Asset / InvestPlan 模型 + 迁移 |
| 3.2 | Account CRUD + 余额管理 |
| 3.3 | Bill CRUD + 收支分类 + 流水查询 |
| 3.4 | Budget 预算管理 + 超支预警 |
| 3.5 | Asset 持仓管理 + 盈亏计算（后端 calculator） |
| 3.6 | InvestPlan 定投计划 + 到期事件发布 |
| 3.7 | 前端 FinanceHome 资产总览仪表盘 |
| 3.8 | 前端 AccountList + BillList + BillForm |
| 3.9 | 前端 BudgetBoard |
| 3.10 | 前端 Portfolio + InvestPlan |
| 3.11 | 前端图表：资产占比饼图、收支趋势折线图、盈亏柱状图 |

**验收标准：**
- 完整记账流程（账户→账单→分类统计）
- 预算设置 + 超支提醒
- 持仓盈亏实时计算
- 图表可视化

### Phase 4：跨模块联动 + 全局功能（预计 3-5 天）

| 步骤 | 内容 |
|------|------|
| 4.1 | 事件总线完善：定投到期 → 生成待办提醒 |
| 4.2 | 全局标签：Task / Bill 等打标签 + 标签聚合查询 |
| 4.3 | 全局仪表盘：聚合 daily + finance 关键数据 |
| 4.4 | 全局搜索：跨模块全文检索 |
| 4.5 | SyncLog 同步引擎 + 同步 API |
| 4.6 | 数据导出（JSON/CSV） |

**验收标准：**
- 定投到期自动生成待办（事件驱动）
- 标签可关联任务和账单，按标签聚合查询
- 首页仪表盘展示今日待办数 + 本月收支 + 持仓总市值
- 全局搜索可跨模块命中

---

## 八、开发规范

### 8.1 模块隔离铁律

```
✅ 允许：module_daily 导入 base.core、base.db、base.models
❌ 禁止：module_daily 导入 module_finance.xxx
❌ 禁止：module_daily 导入 module_finance.models
✅ 跨模块通信唯一渠道：event_bus.publish() / event_bus.subscribe()
```

### 8.2 前端对应规范

```
✅ 允许：module-daily/stores 导入 base/stores/authStore
❌ 禁止：module-daily/stores 导入 module-finance/stores/xxx
✅ 跨模块通信：动态路由、全局事件、URL 参数
```

### 8.3 Git 规范

- 分支：`phase/1-xxx`, `phase/2-xxx`, `feature/xxx`, `fix/xxx`
- Commit：`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- 每个 Phase 完成后合并到 `main`

---

## 九、Poetry 初始依赖

```toml
[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.115.0"
uvicorn = {extras = ["standard"], version = "^0.30.0"}
sqlalchemy = {extras = ["asyncio"], version = "^2.0.30"}
asyncpg = "^0.29.0"
alembic = "^1.13.0"
pydantic = "^2.8.0"
pydantic-settings = "^2.4.0"
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
redis = "^5.0.0"
httpx = "^0.27.0"
python-multipart = "^0.0.9"

[tool.poetry.group.dev.dependencies]
pytest = "^8.3.0"
pytest-asyncio = "^0.23.0"
httpx = "^0.27.0"
ruff = "^0.5.0"
mypy = "^1.10.0"
```

---

> **当前状态：待开发**  
> **下一步：Phase 1 — 底座搭建，从 Poetry 初始化开始**
