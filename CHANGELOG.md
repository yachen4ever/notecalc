---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '0e59795d-9dfd-451c-abb3-f925e65d9203'
  PropagateID: '0e59795d-9dfd-451c-abb3-f925e65d9203'
  ReservedCode1: 'd1fd518f-9680-4dac-8514-5c9de5f7fd63'
  ReservedCode2: 'd1fd518f-9680-4dac-8514-5c9de5f7fd63'
---

# 更新日志

## v0.7.0 (2026-08-11)

### V6 复合单位智能识别

#### 新功能

- **复合单位归一化**：输入同类单位的组合，自动归一化为基准值并展示
  - `1天20小时48分钟` → `1.87 天`（不再被错误提取为 69）
  - `1kg + 200g` → `1.2 千克`
  - `1km 500m 20cm` → `1.5 千米`
  - `2L 500ml` → `2.5 升`
  - `5英尺 6英寸` → `1.68 米`
- **单位切换器 UI**：结果区显示 ▾ 下箭头，hover 弹出菜单可在同类单位间切换
  - 天 / 小时 / 分钟 / 秒 / 毫秒
  - 吨 / 千克 / 克 / 毫克 / 磅 / 盎司 / 斤 / 两 / 钱
  - 千米 / 米 / 厘米 / 毫米 / 英里 / 英尺 / 英寸 / 码 / 里 / 丈 / 尺 / 寸 / 海里
  - 平方千米 / 平方米 / 平方厘米 / 公顷 / 亩 / 英亩 / 平方英尺
  - 升 / 毫升 / 加仑 / 杯
- 规则引擎新增 `compoundUnitRule`，位于 `unitConversionRule` 之后
- `getUnitLabel` 优先使用中文名（千克而非 kg、千米而非 km）
- 支持 `+` 号和空格两种连接方式

#### 测试

- 单元测试 182 个全部通过（10 个测试文件）
- 新增测试：复合单位归一化 16 个（时间/重量/长度/体积复合、+号连接、边界 case、unitInfo 结构验证）

---

## v0.6.0 (2026-08-11)

### V5 性能优化 + 健壮性增强 + 体验改进

#### 性能优化

- **替换 mathjs 为 expr-eval**：mathjs 占 bundle 93%（757KB），实际仅用 `evaluate()` 做四则运算
  - 换成 expr-eval（6KB）后，bundle 从 757KB 降到 116KB（gzip 43KB），体积减少 85%
  - 架构图中 `mathjs 表达式` 更新为 `expr-eval 表达式`

#### 健壮性增强

- **修复 numberExtractionRule 兜底误触发**：含中文语义关键词（比/少/多/平均/次方等）的文本不再被盲目提取数字求和，避免大量静默错误
- **前向引用 / 自引用 / 越界引用检测**：原代码静默替换为 0，现改为报错（`error` 字段，UI 显示 ⚠ 红色警告 + hover 提示具体原因）
- **中文大数单位 万/亿 支持**：`1万` → 10000、`3.5亿` → 350000000、`2万5` → 25000（`expandChineseMagnitude` 预处理）
- **变量名冲突检测**：用户定义 `l1 = 42` 会与行引用系统冲突，赋值时检测并报错
- **formatNumber(-0) 修复**：`value === 0` 时直接返回 `"0"`，避免显示 `-0`

#### 体验改进

- **导入功能改用 Tauri dialog**：`open()` + `readTextFile()`，替代不支持的 `a.download` + Blob URL
- **关于对话框链接**：`@tauri-apps/plugin-opener` 的 `openUrl()` 替代无效的 `target="_blank"`
- **Tab 键在行间移动焦点**：Tab → 下移行，Shift+Tab → 上移行（原 Tab 跳出编辑区）
- **错误行视觉提示**：⚠ 图标 + 红色高亮 + title 属性 hover 显示错误原因

#### 测试

- 单元测试 166 个全部通过（9 个测试文件）
- 新增测试：numberExtraction 语义关键词排除（1）、引用错误检测（7）、中文大数单位（6）、变量名冲突（2）

---

## v0.5.0-alpha.1 (2026-08-11)

### 修复 + 改进

- 修复：导出无反应（Tauri WebView 不支持 `a.download` + Blob URL），改用 `tauri-plugin-dialog` 保存对话框 + `tauri-plugin-fs` 写入
- 合并：JSON / CSV / MD 三个导出按钮合一为「导出」，保存时选文件类型
- 新增：禁用 WebView 原生右键菜单（去掉浏览器「另存为/打印/更多工具」等无用项）
- 改进：关于界面图标由 emoji 换成真实应用图标
- 新增依赖：`@tauri-apps/plugin-dialog` + `@tauri-apps/plugin-fs`

---

## v0.4.0-alpha.2 (2026-08-11)

### V4.5 UI 润色

- 新增：自定义弹窗组件 `ModalDialog.vue`，替换原生 `prompt`/`confirm`，修复标题显示 `tauri.localhost 显示` 问题
- 新增：关于对话框（版本号 / 开发者 / 邮箱 / GitHub 项目地址）
- 新增：新应用图标（记事本 + 计算器融合设计：深色背景、白色记事本线条、青色运算符号）

---

## v0.4.0-alpha.1 (2026-08-11)

### V4 变量引用 + 行间依赖 + 聚合函数

- 新增：行引用 `l1` / `line2`，可引用其他行的计算结果参与运算
- 新增：命名变量 `单价 = 100`，后续行可直接用 `单价 * 12` 引用
- 新增：聚合函数（平均/最大/最小/总和），支持中文和英文关键词
  - `平均 100 200 300` → 200、`最大 34 56 78` → 78、`sum 10 20 30` → 60
- 新增：语法高亮增强——变量引用（紫色）、赋值符号（橙色）
- 重构：`buildLineResults` 统一计算整个工作表，支持变量上下文传递
- 重构：`LineRow` 接受 `result` prop，不再独立计算（保证变量引用一致性）
- 重构：导出功能（CSV/Markdown）使用 `buildLineResults`，正确处理变量引用行

---

## v0.3.0-alpha.1 (2026-08-11)

### V3 多工作表 + 持久化 + 导入导出

- 新增：多工作表侧边栏（新增 / 重命名 / 删除 / 切换），每个工作表独立行数据
- 新增：本地持久化，自动保存到 `app_data_dir/notecalc.json`，重启不丢失（500ms 防抖）
- 新增：导入导出（JSON 全量导出/导入、CSV 单表导出、Markdown 单表导出）
- 新增：Rust 后端 `load_data` / `save_data` 命令，前端通过 Tauri invoke 调用
- 调整：窗口默认尺寸 720×520 → 960×600，最小尺寸 480×360 → 640×400（侧边栏占 180px）

---

## v0.2.0 (2026-08-11)

### V2 语义分析完成

- 新增：中文百分比运算（`120的15%` → 18、`120占800的百分比` → 15、`120的百分之15` → 18）
- 新增：单位转换规则引擎，支持 7 大类单位：
  - 长度：km/m/cm/mm、mi/ft/in/yd、里/丈/尺/寸、海里
  - 重量：t/kg/g/mg、lb/oz、斤/两/钱
  - 温度：摄氏度/华氏度/开尔文（非线性特殊转换）
  - 面积：km²/m²/cm²、ha/亩、acre/ft²
  - 体积：L/mL、gal/cup
  - 时间：ms/s/min/h/day
  - 写法：`5km to mi`、`30摄氏度转华氏`、`100kg转斤`、`1英里等于多少千米`
- 新增：浅色/深色主题切换（v0.2-alpha.3）

---

## v0.2-alpha.3 (2026-08-11)

### 新增

- 浅色/深色主题切换：标题栏切换按钮，CSS 变量统一管理主题色，平滑过渡动画

---

## v0.2-alpha.2 (2026-08-11)

### 修复

- CI 动态版本号：从 git tag 提取版本号自动写入 tauri.conf.json 和 package.json，产物文件名不再固定为 0.1.0
- 版本号 semver 规范化：`0.2-alpha.2` → `0.2.0-alpha.2`（Tauri 要求三段式 semver，两段式会报错）
- Windows MSI 兼容：MSI 要求预发布标识符为纯数字，Windows 构建时去掉 `alpha` 后缀（`0.2.0-alpha.2` → `0.2.0`）
- 产物文件名带版本号：tar.gz / zip 命名改为 notecalc-{version}-{label} 格式
- README 补充 V2 语义分析功能说明，路线图标记进度

---

## v0.2-alpha.1 (2026-08-11)

### 新增

- 语义分析规则引擎（中英双语），多级计算管线
- 中文折扣：打8折 / 半价 / 满200减50 / 涨10% / 降10%
- 英文百分比：10% off 200 / 10% of 200 / 200 + 10% / 200 - 10%
- 数字提取求和：餐饮340 打车86 → 426
- 规则引擎架构（composables/rules/），可扩展新增规则

### 规则引擎架构

```
输入文本 → expr-eval 表达式（四则运算+括号）
                ↓ 失败
           中文折扣规则（打折/半价/满减/涨降）
                ↓ 不匹配
           英文百分比规则（off/of/+/-）
                ↓ 不匹配
           数字提取求和（兜底）
                ↓ 无数字
           null（纯文字行）
```

---

## v0.1-alpha.2 (2026-08-10)

### 新增

- 语法高亮叠加层：数字蓝色、运算符青色、纯文字灰色
- input 文字透明 + 光标可见，编辑体验不受影响
- GitHub Actions 跨平台 CI/CD（push tag 自动编译发 release）

### 产物

| 文件 | 平台 | 大小 |
|------|------|------|
| notecalc-windows-x64.zip | Windows x64 | 2.8 MB |
| notecalc-windows-x86.zip | Windows x86 | 2.4 MB |
| notecalc-linux-amd64.tar.gz | Linux amd64 | 3.9 MB |
| notecalc-macos-arm64.tar.gz | macOS arm64 | 2.8 MB |
| notecalc_0.1.0_amd64.deb | Linux amd64 (deb) | 4.0 MB |

---

## v0.1-alpha.1 (2026-08-10)

### 新增

- 行式编辑器：Enter 新建下行、Backspace 删除空行、方向键切换
- 实时计算：输入即算，mathjs 处理四则运算+括号
- 结果右对齐：CSS Grid 三列布局（行号 | 输入 | 结果）
- 底部汇总：自动累加所有有效结果行
- 暗色主题：极简暗色风格，等宽字体

### 技术栈

Tauri 2 + Vue 3 + TypeScript + TailwindCSS v4 + mathjs

### 产物

| 文件 | 平台 | 大小 |
|------|------|------|
| notecalc-aarch64 | macOS arm64 | 9.7 MB |
| notecalc_0.1.0_aarch64.dmg | macOS arm64 | 3.0 MB |