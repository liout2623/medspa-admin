# 医馆管理系统（MedSpa Admin）

> 一套面向中医艾灸馆的全栈管理系统，包含后台管理 SPA 和对外展示大屏，采用 **Vue 3 + TypeScript + Vite** 构建。

---

## 项目概览

| 维度 | 说明 |
|------|------|
| 产品定位 | 中医艾灸馆门店运营管理 + 品牌展示 |
| 核心用户 | 管理员（店长）、理疗师（员工） |
| 前端技术栈 | Vue 3.5 · TypeScript 6 · Vite 8 · Pinia 3 · Vue Router 5 · Vue I18n 9 |
| UI 方案 | 纯手写 CSS 设计系统（零组件库依赖），Lucide 图标 |
| 地图方案 | Leaflet 1.9 + 高德瓦片（国内访问稳定，无需 API Key） |
| 主题 | 浅色 / 深色双模式，CSS 变量驱动，一键切换 |
| AI 助手 | Coze Web Chat SDK 集成，浮窗式 AI 对话 |

---

## 前端界面设计

### 设计语言

整个前端采用 **自研设计系统**，不依赖任何第三方 UI 组件库。通过 `theme.css` 中定义的 30+ CSS 自定义属性实现统一的视觉语言，所有组件共享同一套色板、圆角、阴影和间距体系。

#### 品牌色系

以 **青碧色（Teal）** 为品牌主色，传递中医艾灸的「草本·自然·温和」意象：

| 变量 | 浅色模式 | 深色模式 | 用途 |
|------|----------|----------|------|
| `--brand` | `#0f766e` | `#14b8a6` | 主操作按钮、活跃态、品牌标识 |
| `--brand-dark` | `#115e59` | `#0f766e` | Hover 加深、侧边栏渐变 |
| `--brand-light` | `#5eead4` | `#7de6d8` | 边框高亮、步骤圆环 |
| `--brand-end` | `#0d9488` | `#2dd4bf` | 渐变终点色、按钮渐变 |

#### 双色模式

- **浅色模式**：白底（`#f8fafc` / `#ffffff`）+ 柔和阴影，营造干净通透的医疗空间感
- **深色模式**：深蓝灰底（`#0f172a` / `#1e293b`）+ 低透明度边框，减少长时间使用视觉疲劳
- 切换逻辑：`uiStore.setTheme()` → `document.documentElement.classList.toggle('dark')` → 所有 CSS 变量即时生效
- 持久化：主题偏好存入 `localStorage`，首次访问自动检测系统 `prefers-color-scheme`
- 展示大屏（WelcomePage）强制浅色主题，不受全局暗色模式影响

#### 排版与动效

- **字体**：Inter + 系统回退栈，`-webkit-font-smoothing: antialiased`
- **圆角体系**：8px（按钮/输入）→ 10px（小卡片/徽章）→ 12px（卡片/区块）→ 14–18px（模态框）
- **阴影**：双层柔和阴影 `--shadow` / `--shadow-lg`，深色模式下加深
- **过渡**：全局 `0.2–0.3s ease` 过渡，涵盖背景色、边框、阴影、位移（`transform`）
- **微交互**：按钮 hover 上浮 `translateY(-1px)` + 阴影增强；卡片 hover 上浮 `translateY(-4px)` + 品牌色阴影

---

### 页面结构

```
/login              ← 登录/注册页（独立全屏）
/welcome            ← 门店展示大屏（公开页面，独立全屏）
/                   ← 管理后台（AppLayout 布局）
  /dashboard        ← 工作台
  /customers        ← 客户管理
  /customers/:id    ← 客户详情
  /appointments     ← 预约管理
  /services         ← 服务项目管理（ADMIN）/ 服务项目展示（STAFF）
  /users            ← 用户管理（仅 ADMIN）
  /profile          ← 个人设置
```

---

### 各页面设计详解

#### 1. 登录 / 注册页（Login.vue）

- **全屏渐变背景**：`135deg` 三色渐变（深青→青→青蓝），浅色与深色各有独立配色
- **居中卡片**：`380px` 宽卡片，顶部品牌色渐变 Header（🏥图标 + 系统标题），下方白色表单区
- **注册模式**：表单区域可滚动，包含验证码（图片验证 + 点击刷新）、确认密码等字段
- **主题切换**：右上角悬浮 Moon/Sun 按钮，可切换浅/深色模式
- **模式切换**：登录 ↔ 注册通过底部链接切换，无页面跳转

#### 2. 管理后台布局（AppLayout.vue）

采用经典的 **侧边栏 + 顶栏 + 内容区** 三区布局：

**侧边栏（240px）**
- 顶部品牌区：叶片图标（白底青色圆角方块）+「医馆管理系统」标题
- 品牌色渐变背景：`180deg, #0b5f58 → #0f766e`
- 导航菜单：Lucide 图标 + 文字，活跃项有左侧 `4px` 青色竖条 + 半透明背景
- 管理员专属菜单项（用户管理）通过 `v-if="isAdmin"` 条件渲染
- **响应式**：≤980px 收窄至 208px；≤760px 折叠为 76px 图标模式

**顶栏（60px）**
- 左侧：当前页面标题（从路由 `meta.title` 读取，STAFF 用户在服务页显示「服务项目展示」）
- 右侧：主题切换按钮 · 在线状态绿点 + 用户头像（首字圆形）+ 姓名 · 退出按钮（品牌渐变）

**内容区**
- `flex: 1` + `overflow: auto`，统一 `18px` 内边距

#### 3. 工作台（Dashboard.vue）

三行 CSS Grid 布局（`repeat(3, 1fr)`），承载 6 张功能卡片：

| 卡片 | 占列 | 内容 |
|------|------|------|
| 今日预约 | 2/3 | 预约列表（时间·客户·服务·状态徽章），最多显示 5 条 |
| 今日概览 | 1/3 | 大号数字统计（总预约 / 已完成 / 待服务），竖线分隔 |
| 待服务预约 | 1/3 | 仅显示 BOOKED 状态的预约 |
| 最近新增客户 | 1/3 | 客户名（可点击跳转详情）· 手机号 · 日期 |
| 本周生日客户 | 1/3 | 客户名 · 生日 · 手机号，支持一键复制名单 |
| 门店展示大屏 | 3/3 | iframe 实时预览 + ResizeObserver 自适应缩放 + 复制/跳转按钮 |

- **加载态**：shimmer 骨架屏动画（渐变扫光）
- **空状态**：虚线边框 + 图标 + 提示文案
- **错误态**：AlertCircle 图标 + 重试按钮

#### 4. 客户管理（CustomerList.vue）

- **工具栏**：导出 Excel · 批量录入（仅 ADMIN） · 新增客户
- **搜索栏**：带搜索图标的输入框 + 查询/重置按钮，搜索参数同步到 URL Query（`keyword`/`page`/`size`）
- **标签云**：自动从客户 `tags` 字段提取（`normalizeTags` 函数按中英文逗号拆分），药丸式按钮，活跃态品牌渐变，支持单标签筛选
- **数据表格**：ID · 姓名（可点击链接 + 查看详情药丸按钮）· 手机号 · 邮箱 · 标签 · 操作（查看/编辑/删除 mini 按钮）
- **批量录入弹窗**：表格形式多行输入，支持动态增删行，标签字段提示"逗号分隔标签"
- **分页**：上一页/下一页 + 页码/总数显示
- **URL 状态持久化**：搜索关键词、页码、每页条数同步到 `route.query`，刷新页面自动恢复

**标签分隔逻辑**：`normalizeTags` 函数使用正则 `/[,，]/` 同时支持英文逗号和中文逗号拆分，`trim()` 去空格，`filter(Boolean)` 过滤空串。数据库存储原始逗号分隔字符串，拆分仅在前端展示/筛选时执行。

#### 5. 客户详情（CustomerDetail.vue）

- **头部卡片**：返回按钮 + 大号客户名（28px/800） + 复制主要信息/编辑按钮
- **基本信息卡片**：`dl > dt/dd` 两栏布局（120px + 自适应），标签以 chip 形式展示（按逗号拆分），备注支持 `pre-wrap`
- **时间信息卡片**：创建/更新时间
- **健康档案面板**（HealthRecordPanel）：独立组件，时间线式记录列表，每条包含日期徽章 + 记录人 + 体质评估 + 艾灸建议，支持 CRUD
- **加载态**：shimmer 骨架占位（长短不一的线条 + 药丸）
- **异常态**：404/错误分别有专属空状态页面（大 Emoji + 文案 + 操作按钮）
- **表单校验**：新增/编辑客户时，手机号校验 `/^1\d{10}$/`，邮箱校验 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

#### 6. 预约管理（AppointmentList.vue）

最复杂的页面，提供 **月/周/日** 三种日历视图：

**工具栏（两行）**
- 第一行：视图切换（月/周/日 药丸按钮组） · 前后导航（带边界限制：不可早于今天，不可晚于 14 天后） · 今天按钮 · 日期显示 · 新增预约
- 第二行：理疗师筛选（ADMIN 下拉 / STAFF 锁定标签） · 状态筛选（全部/已预约/已完成/已取消按钮组）

**月视图**
- 7 列网格，表头「周一→周日」
- 日期格：日期数字 + 彩色圆点指示器（青色=已预约、灰色=已完成、红色=已取消）+ 数量
- 今天日期高亮：圆形品牌色背景
- 超出范围日期（过去/14天后）灰显且不可点击
- 点击日期 → 切换到日视图

**周视图**
- 7 列时间网格，每列 8:00–21:00（13 小时 × 64px = 832px）
- 预约以色块展示：青色=已预约、灰色=已完成、红色=已取消（含删除线）
- 重叠预约自动排列（列布局算法）
- 红色「当前时间」指示线（60s 刷新）
- 点击空白区域自动创建对应时间的预约
- 表头日期可点击切换到日视图

**日视图**
- 单日详细时间轴，左侧时间标签 + 右侧预约色块
- 点击空白区域自动创建对应时间的预约（30 分钟对齐）
- 红色「当前时间」指示线 + 时间徽章（60s 刷新）

**预约色块样式**
- 左侧 3px 彩色竖线标识状态
- hover 上浮 + 阴影增强
- 已取消项标题加删除线

**导航边界**：`canGoPrev` / `canGoNext` 计算属性限制导航范围，最早到今天，最晚到今天+14天。月视图导航先固定到 1 号再加减月份，避免 31 号跳月问题。

#### 7. 预约表单弹窗（AppointmentFormModal.vue）

- **理疗师-服务联动**：选择理疗师后，服务项目下拉框自动加载该理疗师负责的服务（通过 `getTherapistServices` API），切换理疗师时清空已选服务
- **ADMIN**：可选择任意理疗师，服务列表根据所选理疗师动态更新
- **STAFF**：理疗师字段锁定为当前用户（只读输入框），自动加载自己负责的服务项目
- **日期限制**：仅允许选择今天至未来 14 天内的日期，超出范围显示红色提示
- **时间步进**：`step="300"`（5 分钟间隔）
- **409 冲突**：后端校验同一理疗师时间段不可重叠，返回 409 时前端显示「该理疗师此时间段已被占用」

#### 8. 预约详情弹窗（AppointmentDetailModal.vue）

- 展示客户、服务项目（含时长）、理疗师、预约时间范围、状态徽章、备注
- **权限控制**：
  - 仅 BOOKED 状态的预约可操作
  - ADMIN 或自己的预约可执行「完成」「取消」操作
  - 仅 ADMIN 可「删除」预约
- 取消/删除均需二次确认

#### 9. 服务项目管理（ServiceList.vue）

- **ADMIN 视图**：完整工具栏 + 操作列（编辑/删除/启停切换），ID 列显示真实 ID
- **STAFF 视图**：只读展示（页面标题变为「服务项目展示」），无新增按钮、无操作列，ID 列显示序号
- 标准表格 + 搜索/状态筛选工具栏
- 名称列：双行展示（项目名 + 描述，描述截断省略）
- 价格列：`¥` 格式化，`toFixed(2)`
- 时长列：`xx 分钟` 格式
- 状态列：启用/停用彩色徽章（绿色/红色）
- 操作列（仅 ADMIN）：编辑 · 删除 · 启停切换（带 Toggle 图标的品牌色 mini 按钮）

#### 10. 用户管理（UserList.vue）

- 仅 ADMIN 可见
- 标准表格 + 搜索/角色/状态三重筛选
- 角色列：管理员（紫色徽章）/ 员工（蓝色徽章）
- 新增/编辑弹窗：Grid 表单（140px 标签列 + 输入列）
- 导出 Excel 功能
- **理疗师服务项目配置**（新增功能）：
  - STAFF 角色用户操作列额外显示「配置项目」按钮（齿轮图标）
  - 点击打开配置弹窗，勾选该理疗师负责的服务项目
  - 并行加载全部启用项目 + 该理疗师已有项目（`Promise.all`）
  - 保存时调用 `assignTherapistServices` API 提交 `therapistId + serviceIds`

#### 11. 个人设置（AccountSettings.vue）

三列 Grid 布局：

| 卡片 | 内容 |
|------|------|
| 密码修改 | 当前密码 + 新密码 + 确认密码，提交后自动登出跳转 |
| 外观偏好 | 浅色/深色双按钮，活跃态品牌渐变 + 阴影 |
| 危险操作 | 注销账号（红色警告风格卡片，二次密码确认弹窗） |

#### 12. 门店展示大屏（WelcomePage.vue）

公开访问的品牌展示页，强制浅色主题（通过局部 CSS 变量覆盖 `html.dark`）：

- **Hero 区**：全屏品牌渐变 + 径向光晕叠加 + 居中标题/副标题/CTA 按钮（毛玻璃效果）+ 右上角语言切换药丸
- **艾灸文化区**：浅灰背景 + 居中大段文字
- **服务展示区**：自适应卡片网格（`auto-fill, minmax(280px, 1fr)`），卡片 hover 上浮 + 品牌色阴影，展示名称/价格/时长/描述
- **调理流程区**：4 步骤横向排列，圆形图标（hover 变色放大）+ 箭头连接线
- **联系我们区**：双列布局（联系信息 + Leaflet 地图）
  - 地图使用 Leaflet + 高德瓦片（`webrd0{s}.is.autonavi.com`），无需 API Key
  - 标记点坐标：杭州城市学院（WGS-84: 30.3249, 120.1493）
  - 修复了 Leaflet 默认图标路径问题（使用 unpkg CDN 图片）
  - 延迟 `invalidateSize()` 确保容器渲染后正确加载瓦片
- **页脚**：深色品牌底 + 版权 + 社交图标
- **AI 助手**：CozeChat 浮窗组件，支持中英文切换
- **滚动动画**：IntersectionObserver 驱动各 section 淡入上移

---

### 通用 UI 组件

#### 按钮

| 样式类 | 外观 | 用途 |
|--------|------|------|
| `.btn-primary` | 品牌色实心 + 品牌阴影 | 主要操作 |
| `.btn-ghost` | 透明底 + 边框 | 次要操作 |
| `.btn-mini.edit` | 蓝色半透明底 + 边框 | 编辑行内操作 |
| `.btn-mini.del` | 红色半透明底 + 边框 | 删除行内操作 |
| `.btn-mini.toggle` | 品牌色半透明底 + 边框 | 启停切换 |
| `.btn-mini.svc-assign` | 蓝色半透明底 + 边框 | 理疗师服务配置 |

#### 表单

- `.input` / `.select` / `textarea`：统一 8px 圆角、1px 边框、聚焦态品牌色描边 + 3px 外发光
- `.grid`：`140px label + 1fr input` 的双列表单布局
- 错误横幅：红色半透明底 + 红色边框
- **客户端校验**：
  - 客户手机号：`/^1\d{10}$/`（11 位，1 开头）
  - 客户邮箱：`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - 预约日期：今天 ~ 未来 14 天
  - 理疗师-服务联动：选择理疗师后服务列表动态更新

#### 表格

- `.tbl`：分离边框，表头浅灰底 + 小号加粗字，行 hover 变色
- 首列/末列表头圆角处理

#### 徽章

| 样式类 | 颜色 | 用途 |
|--------|------|------|
| `.badge-admin` | 紫色 | 管理员角色 |
| `.badge-staff` | 蓝色 | 员工角色 |
| `.badge-on` | 绿色 | 启用状态 |
| `.badge-off` | 红色 | 停用状态 |

深色模式下自动切换为对应的低透明度 + 浅色文字版本。

#### 模态框

- 全屏遮罩（`var(--overlay)`）+ 居中卡片（`min(680px, 92vw)`，18px 圆角）
- 标题 + 内容 + 底部操作按钮行（右对齐）

#### Toast 通知

- 固定顶部居中，`z-index: 4000`
- 三种类型：success（绿）/ error（红）/ info（蓝）
- `<transition>` 淡入淡出 + 轻微上移动画
- 2.2 秒自动消失

#### 确认弹窗

- `z-index: 3500`，Promise 化交互（`await ui.confirm(title, message)`）
- 取消/确定双按钮

#### 骨架屏

- 渐变扫光动画（`shimmer` keyframes），用于 Dashboard 和 CustomerDetail 的加载态

---

### AI 智能助手（CozeChat）

- 基于 **Coze Web Chat SDK**（`1.2.0-beta.19`）的浮窗式对话组件
- 浮球按钮由 SDK 自动渲染在页面右下角
- 配置项：
  - Bot 模式，指定 bot_id
  - Token 认证（从 `VITE_COZE_TOKEN` 环境变量读取）
  - 自定义用户信息（昵称「您」+ 自定义头像）
  - 自定义 UI：品牌图标、PC 布局、跟随页面语言（zh-CN / en）、宽度 390px、支持语音
  - 隐藏底部「Powered by Coze」、禁用文件上传
- 语言切换时自动销毁重建实例

---

### 国际化（i18n）

- 基于 `vue-i18n`，默认中文，支持英文切换
- 当前仅 WelcomePage 展示页使用 i18n，管理后台界面为中文
- 语言文件：`src/locales/zh.json` / `src/locales/en.json`
- 语言切换：WelcomePage 右上角药丸按钮，切换时 CozeChat 同步重建

---

### 响应式设计

| 断点 | 侧边栏 | 内容区调整 |
|------|--------|-----------|
| > 980px | 完整 240px | 默认多列 Grid |
| 760–980px | 208px | 部分卡片合并列 |
| < 760px | 76px 图标模式 | 单列堆叠，隐藏次要信息 |

典型响应式处理：
- Dashboard：3列 → 2列 → 1列
- 预约日历：隐藏状态筛选按钮组，缩短日期显示
- 客户详情：信息行从双列变单列
- 个人设置：3列变单列
- 登录页：卡片宽度 `380px`，小屏自适应
- WelcomePage：Hero 字号缩小、服务卡片单列、流程步骤竖排、联系区单列

---

### 权限体系

| 角色 | 可访问页面 | 特殊 UI 行为 |
|------|-----------|-------------|
| ADMIN | 全部页面 | 侧边栏显示「用户管理」；预约筛选可选全部理疗师；服务/用户管理显示完整操作列；可为理疗师配置服务项目 |
| STAFF | 工作台/客户/预约/服务/个人设置 | 预约自动锁定理疗师为自己；服务列表为只读展示（标题变更、无操作列）；新增预约理疗师字段自动填充且锁定 |

路由守卫在 `router.beforeEach` 中统一拦截，未登录跳 `/login`，STAFF 访问管理页跳 `/customers`。

**API 层双重保障**：前端 `listTherapists` 虽然后端已按 `role=STAFF` 过滤，但前端还额外 `.filter(u => u.role === 'STAFF')` 二次校验。

---

## 理疗师-服务项目关联

系统实现了理疗师与服务项目的多对多关联：

- **数据模型**：后端 `therapist_services` 表，关联 `users`（STAFF）与 `services`
- **API 层**：
  - `GET /therapist-services/{therapistId}` — 获取指定理疗师负责的服务列表
  - `POST /therapist-services` — 为理疗师分配服务项目（`therapistId + serviceIds[]`）
  - `DELETE /therapist-services/{id}` — 删除关联
- **前端入口**：
  1. **用户管理页**：STAFF 用户操作列的「配置项目」按钮，弹出勾选弹窗
  2. **预约表单**：选择理疗师后，服务项目下拉框自动加载该理疗师负责的服务，切换理疗师时清空并重新加载
- **错误降级**：`getTherapistServices` 请求失败时回退显示全部服务项目

---

## 预约时间段重叠校验

- **后端硬性约束**：创建/更新预约时，后端校验同一理疗师的时间段是否重叠，重叠返回 `409 Conflict`
- **前端错误处理**：捕获 409 状态码，显示「该理疗师此时间段已被占用」
- **前端视觉辅助**：日/周视图展示已有预约色块，用户可直观避开冲突时间
- **日期范围限制**：预约仅允许今天至未来 14 天内，前端 `minDateStr` / `maxDateStr` + `isDateOutOfRange` 双重校验

---

## 技术架构

```
src/
├── api/                  # Axios 请求封装
│   ├── http.ts           # Axios 实例（baseURL=/api, withCredentials, 401拦截）
│   ├── appointment.ts    # 预约 CRUD + 状态更新
│   ├── auth.ts           # 登录/注册/验证码/改密/注销
│   ├── customer.ts       # 客户 CRUD + 批量导入/导出
│   ├── health-record.ts  # 健康档案 CRUD
│   ├── service.ts        # 服务项目 CRUD + 启停切换
│   ├── therapistService.ts # 理疗师-服务关联（查询/分配/删除）
│   └── user.ts           # 用户 CRUD + 导出 + listTherapists
├── assets/theme.css      # 全局设计系统（CSS 变量 + 基础组件样式）
├── components/
│   ├── appointment/      # 预约表单弹窗 + 预约详情弹窗
│   ├── coze/             # Coze AI 助手组件
│   ├── customer/         # 客户表单弹窗 + 健康档案面板
│   ├── layout/           # AppLayout（侧边栏 + 顶栏）
│   ├── service/          # 服务表单弹窗
│   └── ui/               # AppToast + ConfirmModal
├── composables/          # useDashboardData（工作台数据逻辑复用）
├── locales/              # 中英文语言包
├── router/               # 路由定义 + 权限守卫
├── stores/               # Pinia 状态（auth / ui）
├── types/                # TypeScript 类型定义
├── utils/                # token 工具（localStorage 存取用户信息）
└── views/                # 页面组件（12 个 .vue 文件）
```

### API 层架构

```
前端 http.ts (Axios)
  ├── baseURL: /api
  ├── withCredentials: true（自动携带 HttpOnly Cookie）
  ├── timeout: 10000
  └── 401 拦截器 → clearUser() + 跳转 /login

Vite Dev Server Proxy
  └── /api → http://localhost:8080（后端 Spring Boot）
```

所有 API 函数统一返回 `ApiResponse<T>` 泛型结构，分页接口返回 `PageResponse<T>`（含 `items` + `total`）。

### 关键技术决策

| 决策 | 原因 |
|------|------|
| 零 UI 库，纯手写 CSS | 极致包体积控制 + 完全自主设计语言 + 避免组件库覆盖样式 |
| CSS 变量驱动主题 | 一套变量同时服务浅/深色模式，切换零闪烁 |
| HttpOnly Cookie 认证 | 前端不存储 JWT Token，降低 XSS 窃取风险；`withCredentials: true` 自动携带 |
| Pinia 替代 Vuex | Vue 3 官方推荐，TS 支持更好，API 更简洁 |
| Composable 复用逻辑 | `useDashboardData` 将工作台数据逻辑从视图层解耦 |
| iframe 嵌入展示大屏 | Dashboard 中实时预览 WelcomePage，ResizeObserver 实现自适应缩放 |
| Leaflet + 高德瓦片 | 国内访问稳定无需 API Key；WGS-84 坐标系直接可用 |
| 理疗师-服务联动 | 预约时服务列表跟随理疗师动态过滤，确保只能预约理疗师擅长项目 |
| URL Query 状态同步 | 客户列表搜索/分页参数同步到 URL，支持刷新恢复和链接分享 |

---

## 数据类型定义

### 预约（Appointment）

```typescript
// 请求
interface AppointmentRequest {
  customerId: number
  serviceId: number
  therapistId: number
  appointmentTime: string  // ISO 格式 "2026-05-25T10:00:00"
  note?: string
}

// 响应
interface AppointmentResponse {
  id: number
  customerId: number; customerName: string
  serviceId: number; serviceName: string
  therapistId: number; therapistName: string
  appointmentTime: string; endTime: string; durationMinutes: number
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED'
  note?: string
  createdAt: string; updatedAt: string
}
```

### 客户（Customer）

```typescript
interface CustomerRequest {
  name: string; phone?: string; email?: string
  gender?: string; tags?: string; note?: string; birthday?: string
}
interface CustomerResponse extends CustomerRequest {
  id: number; createdAt?: string; updatedAt?: string
}
```

### 健康档案（HealthRecord）

```typescript
interface HealthRecordRequest {
  recordDate: string; assessment: string; recommendation?: string
}
interface HealthRecordResponse {
  id: number; customerId: number
  assessment: string; recommendation: string; recordDate: string
  createdBy: number; createdByName: string; createdAt: string
}
```

### 用户（User）

```typescript
interface UserResponse {
  id: number; username: string; role: string
  displayName: string; phone?: string
  occupation?: string; active: boolean
}
interface UserUpsertRequest {
  username: string; password?: string; role: string
  displayName: string; phone?: string; active: boolean
}
```

### 服务项目（Service）

```typescript
interface ServiceRequest {
  name: string; description?: string
  price?: number; durationMinutes?: number; active?: boolean
}
interface ServiceResponse extends ServiceRequest {
  id: number; createdAt?: string; updatedAt?: string
}
```

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 :5173，代理 /api → localhost:8080）
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览构建产物
npm run preview
```

### 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_COZE_TOKEN` | Coze AI 助手的 PAT Token | `sat_xxxxx` |

### 开发代理

`vite.config.ts` 配置了开发代理：

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

所有 `/api` 请求自动代理到后端 Spring Boot 服务（默认 8080 端口）。

---

## 项目截图结构

```
┌─────────────────────────────────────────────────────────┐
│  Login Page                                             │
│  ┌─────────────────────────────────────────┐            │
│  │  🏥 医馆管理系统                         │            │
│  │  ┌──────────────────────────────┐       │            │
│  │  │ 用户名                        │       │            │
│  │  │ 密码                          │       │            │
│  │  │ [ 登 录 ]                     │       │            │
│  │  └──────────────────────────────┘       │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘

┌──────────┬──────────────────────────────────────────────┐
│ 侧边栏    │  顶栏：工作台          🌙 👤管理员 [退出]    │
│          ├──────────────────────────────────────────────┤
│ 🍃 医馆   │  ┌──────────────────┬──────────┐           │
│          │  │  今日预约 (2col)   │ 今日概览  │           │
│ 📊 工作台 │  │  09:00 张三 艾灸   │  5 预约   │           │
│ 👥 客户   │  │  10:30 李四 推拿   │  2 完成   │           │
│ 📅 预约   │  │  ...              │  3 待服务  │           │
│ 📦 服务   │  ├──────┬──────┬─────┤           │           │
│ 👤 用户   │  │待服务 │新客户│🎂生日│           │           │
│ ⚙ 设置   │  ├──────┴──────┴─────┤           │           │
│          │  │ 🖥 门店展示大屏预览   │           │           │
│          │  └────────────────────┘           │           │
└──────────┴──────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  WelcomePage (公开展示大屏)                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │  🌿 Hero: 传承古法艾灸，焕发现代生机         [English] ││
│  │      [查看我们的服务 ▼]                              ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │  🍃 什么是艾灸？                                     ││
│  │  艾灸是中医传统疗法之一...                             ││
│  └─────────────────────────────────────────────────────┘│
│  ┌──────┐ ┌──────┐ ┌──────┐                            │
│  │ 服务1 │ │ 服务2 │ │ 服务3 │  ← 自适应卡片网格         │
│  │ ¥xxx │ │ ¥xxx │ │ ¥xxx │                            │
│  └──────┘ └──────┘ └──────┘                            │
│  ┌─────────────────────────────────────────────────────┐│
│  │  📋 调理流程                                         ││
│  │  ①预约 → ②评估 → ③艾灸 → ④建议                     ││
│  └─────────────────────────────────────────────────────┘│
│  ┌──────────────┐ ┌──────────────────────┐              │
│  │ 📍 联系我们    │ │   🗺 Leaflet 地图     │              │
│  │ 📞 0571-...   │ │   (高德瓦片)         │              │
│  └──────────────┘ └──────────────────────┘              │
│  ┌─────────────────────────────────────────────────────┐│
│  │  © 2026 中医艾灸馆                    🌐 ❤           ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```
