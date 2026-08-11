---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '8721e2e8-25cc-4dbe-8890-eecc85fe4a65'
  PropagateID: '8721e2e8-25cc-4dbe-8890-eecc85fe4a65'
  ReservedCode1: 'dcec6aa9-f305-474d-ac32-414169b02168'
  ReservedCode2: 'dcec6aa9-f305-474d-ac32-414169b02168'
---

# 更新日志

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
输入文本 → mathjs 表达式（四则运算+括号）
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