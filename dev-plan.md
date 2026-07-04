项目名称：LifeHub
中文别名：生活枢纽
仓库名：lifehub-core
定位：插件化模块化个人综合管理中台，支持按需启用模块，现阶段仅开发「日常计划模块」+「资产投资模块」，健身 / 营养 / 兴趣等后续新增零侵入改造。
一、项目说明文档（README 开发版）
LifeHub - 生活枢纽
项目简介
LifeHub 是一套插拔式模块化个人生活数据管理系统，采用「核心底座 + 业务插件模块」架构。
核心底座只负责用户、权限、同步、标签、事件总线、存储、网关等通用底层能力，所有业务功能全部拆分为独立插件，可按需编译、按需启用、按需安装。
现阶段仅实现两大核心插件：
module-daily 日常计划插件：待办、日历、习惯、目标、提醒
module-finance 资产投资插件：记账、账户、预算、持仓、定投、资产分析
健身营养、兴趣收藏、健康追踪等后续仅需新增独立插件目录，无需修改底层核心代码，无耦合。
核心架构特性
完全插件化隔离
每个业务模块独立实体、独立接口、独立路由、独立数据表，模块之间不直接依赖，跨模块通信仅通过全局事件总线。
底座与业务解耦
核心底座不包含任何业务逻辑，只提供通用基础设施。关闭任意业务模块，系统可正常运行。
增量扩展友好
新增模块仅遵循统一插件规范注册到底座，自动完成路由、数据库、API、前端菜单注册。
多端统一适配
后端插件自动输出标准接口；Web/Flutter 客户端配套对应插件页面，底层同步、标签、搜索复用底座能力。
离线优先 + 私有化部署
客户端本地 SQLite 缓存，云端增量同步；Docker 一键部署，数据完全私有。
技术栈（后端示例 SpringBoot，可替换 Go / Node）
后端：SpringBoot3 + MyBatis + PostgreSQL + Redis
前端 Web：Vue3 + Pinia + Vite
移动端：Flutter（离线 SQLite）
部署：Docker Compose
底层能力：事件总线、全局标签、增量同步引擎、统一鉴权网关
插件机制规则
所有业务模块统一前缀 module-xxx；
每个插件提供标准化注册类，自动注入路由、数据库、事件监听；
模块之间禁止直接调用 Service/Mapper；
跨模块数据联动统一发布 / 订阅事件；
可配置开关：application.yml 控制模块启用 / 禁用。
开发迭代规划
第一阶段：搭建核心底座（用户、标签、同步、网关、事件总线）
第二阶段：开发 module-daily 日常计划插件
第三阶段：开发 module-finance 资产投资插件
第四阶段：通用仪表盘、全局搜索、数据导出备份
未来扩展：新增 module-health（健身营养）、module-hobby（兴趣收藏）等插件
二、后端完整分层文件架构（插件化模块化）
lifehub-core 后端根目录
plaintext
lifehub-core/
├── docker/                    # 部署脚本
│   ├── Dockerfile
│   └── docker-compose.yml
├── db/                        # 数据库脚本，分底座脚本 + 各模块脚本
│   ├── base/                  # 核心底座表：user、tag、sync、automation、attachment
│   ├── module-daily/          # 日常模块数据表
│   └── module-finance/        # 资产投资模块数据表
├── src/main/java/com/lifehub
│   ├── base/                  # 【核心底座层，无任何业务】
│   │   ├── user/              # 用户、设备、登录、权限
│   │   ├── tag/               # 全局标签、分类体系（所有模块共用）
│   │   ├── sync/              # 多端增量同步引擎、冲突处理
│   │   ├── event/             # 全局事件总线、事件定义、自动化规则
│   │   ├── search/            # 全局跨模块聚合搜索
│   │   ├── notify/           # 统一消息提醒推送
│   │   ├── storage/           # 文件/对象存储统一封装
│   │   ├── plugin/            # 插件管理器核心（注册、启用、加载）
│   │   ├── gateway/           # API网关、鉴权、统一异常、路由分发
│   │   └── config/           # 系统全局配置、模块开关配置
│   ├── modules/               # 【所有业务插件，插拔式】
│   │   ├── module-daily/      # 日常计划插件（待办/日历/习惯）
│   │   │   ├── plugin/        # 插件注册入口 DailyPlugin.java
│   │   │   ├── entity/       # 模块私有实体：Task、Schedule、Habit、Goal
│   │   │   ├── mapper/
│   │   │   ├── service/
│   │   │   ├── controller/
│   │   │   ├── dto/
│   │   │   └── enums/
│   │   └── module-finance/    # 资产投资插件（记账/持仓/定投）
│   │       ├── plugin/        # 插件注册入口 FinancePlugin.java
│   │       ├── entity/        # Account、Bill、Budget、Asset、InvestHold
│   │       ├── calculator/    # 投资收益、资产占比计算工具（模块内独立）
│   │       ├── mapper/
│   │       ├── service/
│   │       ├── controller/
│   │       └── dto/
│   ├── extension/             # 扩展层（未来第三方插件、数据源对接）
│   │   ├── datasource/        # 股票行情、银行账单导入、健康API
│   │   └── template/          # 计划模板、财务模板
│   └── common/                # 全局通用工具（所有层均可调用）
│       ├── util/
│       ├── exception/
│       ├── result/            # 统一返回体
│       └── enums/
├── src/main/resources
│   ├── application.yml         # 全局配置 + 模块启用开关
│   ├── application-dev.yml
│   └── mybatis/
├── pom.xml
└── README.md

关键插件注册机制说明
每个模块内 plugin/DailyPlugin.java 实现统一插件接口：
自动注册该模块所有 Controller 路由；
自动加载模块数据库脚本；
自动注册模块专属事件生产者 / 消费者；
底座插件管理器读取配置，关闭模块则不实例化该类，接口直接 404。
配置示例 application.yml
yaml
lifehub:
  plugin:
    daily:
      enable: true
    finance:
      enable: true
    health: # 暂未开发，默认关闭
      enable: false

三、Web 前端 lifehub-web 插件化架构（Vue3）
plaintext
lifehub-web/
├── public/
├── src/
│   ├── base/                  # 前端底层底座（与后端底座对应）
│   │   ├── api-base/          # 统一请求封装、鉴权拦截
│   │   ├── store-base/        # 用户、标签、同步全局状态
│   │   ├── router-base/        # 基础路由、布局、侧边栏动态渲染
│   │   ├── components-base/   # 全局通用组件：标签选择器、图表、弹窗
│   │   ├── event-bus/         # 前端全局事件
│   │   └── utils-base/
│   ├── modules/               # 前端业务插件，和后端一一对应
│   │   ├── module-daily/
│   │   │   ├── api/           # 该模块专属接口
│   │   │   ├── store/         # 模块独立状态
│   │   │   ├── router/        # 模块子路由
│   │   │   ├── views/        # 页面
│   │   │   └── components/    # 模块私有组件
│   │   └── module-finance/
│   │       ├── api/
│   │       ├── store/
│   │       ├── router/
│   │       ├── views/
│   │       ├── components/
│   │       └── calculator/    # 前端本地收益计算
│   ├── dashboard/             # 全局总仪表盘（聚合各模块数据）
│   ├── layout/                # 系统全局布局
│   ├── router/index.js        # 自动扫描modules下所有插件路由
│   └── App.vue
├── vite.config.js
└── README.md

四、Flutter 移动端 lifehub-mobile 架构（离线优先）
plaintext
lifehub-mobile/
├── lib/
│   ├── base/                  # 移动端底座
│   │   ├── db/               # 本地SQLite底层封装
│   │   ├── sync/             # 双向同步引擎
│   │   ├── http/             # 云端请求
│   │   ├── store/            # 全局用户、标签状态
│   │   └── common_widget/
│   ├── modules/               # 移动端业务插件
│   │   ├── module_daily/
│   │   │   ├── local_db/     # 该模块本地数据表操作
│   │   │   ├── page/
│   │   │   ├── widget/
│   │   │   └── logic/
│   │   └── module_finance/
│   │       ├── local_db/
│   │       ├── page/
│   │       ├── widget/
│   │       └── calculator/   # 离线资产计算
│   ├── dashboard/
│   └── main.dart
└── pubspec.yaml

五、模块间通信规范（低耦合核心）
1. 禁止直接依赖
module-daily 和 module-finance 代码中不互相 import、不调用对方 Service/Mapper。
2. 跨模块联动统一走事件总线
示例场景 1：财务定投到期 → 生成待办提醒
finance 模块：定投到达执行日，发布事件 InvestPlanDueEvent，携带定投 ID、金额；
base 事件总线全局分发；
daily 模块注册监听该事件，自动创建一条待办 Task。
示例场景 2：设定年度存钱目标（finance）→ 每月自动生成月度预算待办
finance 发布 BudgetTargetCreateEvent；
daily 监听并批量生成月度计划任务。
3. 新增模块时的接入流程（以后续健身 module-health 举例）
在后端 modules/ 新建 module-health 目录，实现 HealthPlugin 注册类；
编写数据表脚本放入 db/module-health；
编写实体、Service、Controller；
按需订阅 / 发布全局事件实现和现有 daily/finance 联动；
前端在 src/modules/ 新建 module-health 页面、路由、接口；
修改配置开启插件开关，无需改动底座与现有业务代码。
六、分层职责边界（开发规范，避免耦合）
base 底座层：只提供通用基础设施，无任何业务字段、业务逻辑；
module 业务插件层：私有数据表、私有业务逻辑、私有计算工具；仅依赖 base，不依赖其他 module；
extension 扩展层：第三方对接、外部导入导出，可选依赖业务模块；
通信唯一渠道：全局事件总线、全局标签关联查询（标签是底座公共能力，所有模块数据可绑定 tag 实现跨模块筛选展示）。
七、扩展优势总结
现阶段只开发日常 + 资产，代码干净无冗余；
后续加健身、兴趣、健康等功能完全独立开发，不会污染现有代码；
可灵活关闭不需要的模块，减少系统资源占用；
插件标准化，后续可支持第三方自定义插件接入；
数据库按模块分脚本，迁移、备份、分库管理更简单；
前后端一一对应插件目录，结构统一，多人协作易维护。
本回答由AI生成，仅供参考，请仔细甄别，谨慎投资。
这是一个python+React的项目，改造一下你的设计
LifeHub 完整改造方案（Python + React 技术栈・插件化模块化）
项目名：LifeHub 生活枢纽
技术栈：
后端：Python FastAPI（插件化架构）+ SQLAlchemy ORM + PostgreSQL + Redis
前端：React + TypeScript + Vite + Zustand + React Router
移动端：Flutter（保留，离线 SQLite 同步逻辑不变）
部署：Docker / Docker Compose
核心设计不变：底座 Base + 可插拔业务模块，当前只实现 module_daily（日常计划）、module_finance（资产投资），后续新增健身 / 兴趣模块零侵入。
一、项目总说明 README（开发版）
LifeHub - 生活枢纽
项目简介
LifeHub 采用「底层通用底座 + 独立业务插件」分层架构，完全解耦业务功能。底座仅提供用户、鉴权、标签、事件总线、多端同步、全局搜索等通用能力，不含任何业务代码；所有业务以独立插件形式存在，通过配置开关启用 / 禁用。
当前仅开发两大插件：
module_daily：日常计划（待办、日历、习惯打卡、目标、提醒）
module_finance：资产投资（记账、多账户、预算、股票 / 基金持仓、定投、资产收益计算）
未来可无缝新增 module_health（健身营养）、module_hobby（兴趣收藏），无需修改底座与现有业务代码。
核心特性
插件隔离：模块间无代码直接依赖，跨模块联动仅通过全局事件总线
按需加载：配置文件控制插件启停，关闭后对应接口、页面自动隐藏
离线优先：移动端本地 SQLite + 云端增量双向同步
全局统一标签：底座提供 tag 体系，所有业务数据可打标签跨模块聚合检索
自动化联动：监听模块事件自动生成提醒、任务、预算等联动逻辑
私有化部署：Docker 一键启动，数据本地存储不上传第三方
技术栈
后端 lifehub-backend
Web 框架：FastAPI
ORM：SQLAlchemy 2.0
数据库：PostgreSQL
缓存 / 事件队列：Redis
数据库迁移：Alembic（按模块分离迁移脚本）
插件管理：自定义插件加载器，自动注册路由、数据库模型、事件监听
鉴权：JWT
前端 lifehub-web
框架：React 18 + TypeScript + Vite
状态管理：Zustand（全局底座状态 + 各模块独立状态）
路由：React Router v6，自动扫描插件路由
UI：Ant Design / Shadcn UI
图表：Recharts（仪表盘资产 / 习惯趋势）
移动端 lifehub-mobile
Flutter + SQLite（本地离线存储）
同步逻辑复用后端底座同步协议
插件通信规则
禁止模块直接导入对方 Model / Service；
业务变更发布标准化事件到 Redis 事件总线；
其他模块按需订阅事件完成联动；
全局标签作为唯一跨模块静态关联手段。
开发阶段规划
阶段 1：搭建 Base 底座（用户、权限、插件管理器、事件总线、同步引擎、数据库基础表）
阶段 2：开发 module_daily 日常计划插件
阶段 3：开发 module_finance 资产投资插件
阶段 4：全局仪表盘、统一通知、导入导出、备份恢复
阶段 5：扩展插件（健康、兴趣、第三方数据源对接）
二、后端目录结构 Python FastAPI
lifehub-backend
plaintext
lifehub-backend/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── alembic/                     # 数据库迁移，分底座/各模块迁移脚本
│   ├── versions/base/           # 用户、标签、同步、自动化规则等底座表迁移
│   ├── versions/module_daily/
│   └── versions/module_finance/
├── app/
│   ├── base/                    # 【底层底座，无任何业务逻辑】
│   │   ├── core/                # 全局核心
│   │   │   ├── config.py        # 全局配置、插件开关配置
│   │   │   ├── plugin_loader.py # 插件加载核心器
│   │   │   ├── event_bus.py     # Redis 全局事件总线
│   │   │   ├── sync_engine.py   # 多端增量同步、冲突处理
│   │   │   └── search.py        # 跨模块全局检索封装
│   │   ├── auth/                # JWT鉴权、用户登录、设备管理
│   │   ├── db/                  # 数据库基础封装、会话、Base模型
│   │   ├── model/               # 底座通用模型：User、Tag、SyncRecord、AutomationRule、Attachment
│   │   ├── api/                 # 底座通用接口：用户设置、标签管理、备份、同步
│   │   ├── notify/             # 统一消息通知服务
│   │   └── storage/             # 文件存储统一封装
│   ├── modules/                 # 【所有可插拔业务插件】
│   │   ├── module_daily/        # 日常计划插件
│   │   │   ├── __init__.py      # 插件注册入口
│   │   │   ├── models/          # 模块私有数据表模型 Task Schedule Habit Goal
│   │   │   ├── schemas/         # Pydantic 请求/响应DTO
│   │   │   ├── services/        # 业务逻辑
│   │   │   ├── api/             # 模块路由接口
│   │   │   └── events.py        # 模块自定义事件、事件订阅逻辑
│   │   └── module_finance/      # 资产投资插件
│   │       ├── __init__.py      # 插件注册入口
│   │       ├── models/          # Account Bill Budget Asset InvestmentHold InvestPlan
│   │       ├── schemas/
│   │       ├── services/
│   │       │   └── calculator.py # 投资收益、资产占比计算工具
│   │       ├── api/
│   │       └── events.py        # 定投到期、预算超额等事件定义与监听
│   ├── extension/               # 扩展层（外部数据源、导入导出模板）
│   │   ├── datasource/          # 股票行情API、账单导入适配器
│   │   └── export/
│   ├── common/                  # 全局通用工具
│   │   ├── utils.py
│   │   ├── exceptions.py        # 统一异常
│   │   └── response.py          # 统一返回格式
│   └── main.py                  # 项目入口：加载底座 + 自动扫描注册所有启用插件
├── .env.example                 # 环境变量模板（含插件开关）
├── requirements.txt
└── README.md

关键插件注册机制说明
每个插件根目录 __init__.py 统一暴露插件实例，底座 plugin_loader.py 自动扫描 modules/ 目录，读取环境变量 / 配置判断是否启用：
启用：自动挂载路由、注册数据库模型、注册事件订阅者
关闭：跳过加载，对应接口访问返回 404
环境配置示例 .env
env
# 插件开关
PLUGIN_DAILY_ENABLE=true
PLUGIN_FINANCE_ENABLE=true
# 暂未开发，默认关闭
PLUGIN_HEALTH_ENABLE=false
PLUGIN_HOBBY_ENABLE=false

跨模块事件联动示例
module_finance 定投到期，发布事件 InvestPlanDueEvent 到 Redis 总线
base/event_bus 全局分发事件
module_daily/events.py 提前订阅该事件，自动调用服务生成待办任务
全程两个模块无互相导入，完全解耦。
三、前端 React + TS 项目 lifehub-web 插件化结构
plaintext
lifehub-web/
├── public/
├── src/
│   ├── base/                    # 前端底层底座（对应后端base）
│   │   ├── api-base/            # 统一请求封装、拦截器、鉴权
│   │   ├── store-base/          # 全局zustand状态：用户、标签、同步配置
│   │   ├── router-base/         # 基础布局、侧边栏动态渲染逻辑
│   │   ├── components-base/     # 全局通用组件：标签选择器、通用弹窗、图表容器
│   │   ├── event-bus.ts         # 前端页面内事件通信
│   │   └── utils-base/
│   ├── modules/                 # 前端业务插件，与后端modules一一对应
│   │   ├── module-daily/
│   │   │   ├── api/             # 该模块专属接口请求
│   │   │   ├── store/           # 模块独立zustand状态
│   │   │   ├── routes.ts        # 模块子路由定义
│   │   │   ├── pages/           # 页面组件
│   │   │   └── components/      # 模块私有业务组件
│   │   └── module-finance/
│   │       ├── api/
│   │       ├── store/
│   │       ├── routes.ts
│   │       ├── pages/
│   │       ├── components/
│   │       └── calculator/      # 前端离线资产计算工具
│   ├── dashboard/               # 全局总仪表盘（聚合所有启用模块数据）
│   ├── layout/                  # 全局布局框架（侧边栏、顶部导航）
│   ├── router/
│   │   └── index.ts             # 自动读取modules下所有插件路由并合并
│   ├── App.tsx
│   └── main.tsx
├── tsconfig.json
├── vite.config.ts
└── package.json

前端插件加载逻辑
路由入口自动遍历 src/modules/ 下所有文件夹，读取每个模块 routes.ts，动态注入全局路由；
侧边栏根据环境插件开关动态渲染菜单，关闭的模块自动隐藏对应页面入口。
四、Flutter 移动端 lifehub-mobile（结构不变，仅对接 Python 后端接口）
plaintext
lifehub-mobile/
├── lib/
│   ├── base/
│   │   ├── local_db/            # 本地SQLite底层封装
│   │   ├── sync/                # 和FastAPI后端同步协议实现
│   │   ├── http/                # 请求后端FastAPI接口
│   │   ├── global_store/
│   │   └── common_widgets/
│   ├── modules/
│   │   ├── module_daily/
│   │   │   ├── local_dao/       # 本地数据表操作
│   │   │   ├── pages/
│   │   │   ├── widgets/
│   │   │   └── logic/
│   │   └── module_finance/
│   │       ├── local_dao/
│   │       ├── pages/
│   │       ├── widgets/
│   │       └── calculator/
│   ├── dashboard/
│   └── main.dart
└── pubspec.yaml

五、新增模块标准流程（以未来 module_health 健身营养举例）
后端
在 app/modules/ 创建 module_health 完整目录（models/schemas/services/api/events）
编写 __init__.py 插件注册代码
在 alembic/versions 新建模块迁移脚本
.env 开启 PLUGIN_HEALTH_ENABLE=true
在 events.py 按需订阅 / 发布全局事件，实现与 daily/finance 联动
前端 Web
src/modules 新建 module-health 目录，编写 api/store/routes/pages
路由自动扫描，侧边栏自动生成菜单，无需修改底座代码
移动端 Flutter
lib/modules 新建 module_health，编写本地存储与页面
优势
原有日常、资产模块代码完全不动，无任何耦合风险，可独立开发、单独测试、单独上线。
六、分层职责约束（开发规范）
base 底座层：只做通用基础设施，不存在任何业务字段、业务计算逻辑；
modules 插件层：私有模型、私有接口、私有计算逻辑，仅导入 base 包，禁止 import 其他 module；
跨模块交互唯一渠道：Redis 事件总线 + 全局 Tag 标签聚合查询；
计算逻辑内聚：财务收益、营养计算放在对应模块内部 calculator，前后端各实现一套保证离线数据一致；
数据隔离：每个模块数据库表独立，迁移脚本分离，备份可分模块导出。