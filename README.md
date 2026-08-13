---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '403c1c22-bbb4-4338-973c-57459644a221'
  PropagateID: '403c1c22-bbb4-4338-973c-57459644a221'
  ReservedCode1: 'e6df6172-ee6f-4736-9e10-b7b5d16e4860'
  ReservedCode2: 'e6df6172-ee6f-4736-9e10-b7b5d16e4860'
---

# notecalc

[English](README_EN.md) · [更新日志](CHANGELOG.md)

记事本风格的跨平台计算器，类似 Soulver / Numi。左边逐行输入算式或文字，右边实时展示结果，底部自动汇总。

![screenshot](https://cdn.jsdelivr.net/gh/yachen4ever/notecalc@main/docs/screenshot-dark.png)

## 功能

### 基础计算
- 行式编辑器，逐行输入，Enter 新建行、Backspace 删除空行
- 实时计算，输入即算，无需按钮触发
- 四则运算 + 括号（expr-eval 引擎）
- 语法高亮：数字蓝色、运算符青色、变量名紫色、赋值符号橙色、纯文字灰色
- 结果右对齐，底部自动汇总所有有效结果行
- 浅色 / 深色 / 跟随系统主题（在设置中切换）

### 设置与个性化
- 字体选择（SF Mono / Cascadia Code / JetBrains Mono 等 7 种）
- 字号调节（12-20px）
- 界面语言切换（中文 / English）
- 小数位数可调（0-6 位）
- 千分位分隔符开关
- Tab 键行为（行间跳转 / 缩进）
- 导出编码选择（UTF-8 BOM / GBK，解决 Windows Excel 中文乱码）
- 默认导出格式设置（JSON / CSV / Markdown）

### 语义分析
- 中文折扣：`打8折`、`半价`、`满200减50`、`涨10%`、`降10%`
- 中文百分比：`120的15%` → 18、`120占800的百分比` → 15
- 英文百分比：`10% off 200` → 180、`10% of 200` → 20、`200 + 10%` → 220
- 单位转换（7 大类 60+ 单位）：`5km to mi` → 3.11、`30摄氏度转华氏` → 86、`100kg转斤` → 200
- 复合单位归一化：`1天20小时48分钟` → 1.87 天、`1kg + 200g` → 1.2 千克，结果区可切换同类单位
- 单单位也可切换：`1小时` → 1 小时，可切换为 分钟/秒/天
- 数字提取求和：多段文字中的数字自动提取并相加（如"餐饮340 打车86"→ 426）
- 中文大数单位：`1万` → 10000、`3.5亿` → 350000000、`2万5` → 25000
- 基于规则引擎实现，确定性、快速、离线，无需大模型
- 小数默认保留 2 位（可在设置中调整 0-6 位），自动去尾零（3.14、3.1、3）

### 变量与引用
- 行引用：`l1` / `line2` 引用其他行的计算结果
- 命名变量：`单价 = 100`，后续行用 `单价 * 12` 引用
- 聚合函数：`平均` / `最大` / `最小` / `总和`（avg / max / min / sum）
- 引用错误检测：前向引用、自引用、越界引用自动报错（⚠ 提示）
- 变量名冲突检测：`l1`、`line2` 等保留名不可用作变量名

### 多工作表与持久化
- 多工作表侧边栏：新增 / 重命名 / 切换 / 删除，每表独立数据
- 本地持久化：自动保存（500ms 防抖），重启不丢失（JSON 文件存储）
- 导入导出：JSON 全量导入导出、CSV 导出、Markdown 导出
- Tab 键在行间快速移动焦点（Tab 下移，Shift+Tab 上移）

## 技术栈

| 组件 | 选择 |
|------|------|
| 应用框架 | Tauri 2 |
| 前端框架 | Vue 3 |
| 语言 | TypeScript |
| 样式 | TailwindCSS v4 |
| 表达式解析 | expr-eval |
| 构建工具 | Vite |

## 开发

```bash
npm install
npm run tauri dev
```

构建产物：

```bash
npm run tauri build
```

## 下载

前往 [Releases](https://github.com/yachen4ever/notecalc/releases) 获取各平台编译产物：

| 产物 | 平台 |
|------|------|
| notecalc-{version}-windows-x64.zip | Windows x64 |
| notecalc-{version}-windows-x86.zip | Windows x86 |
| notecalc-{version}-linux-amd64.tar.gz | Linux amd64 |
| notecalc-{version}-macos-arm64.tar.gz | macOS arm64 (Apple Silicon) |
| notecalc_{version}_amd64.deb | Linux amd64 (deb) |

## 路线图

- **v0.1** ✅ 四则运算+括号、行编辑器、实时结果、汇总、语法高亮、浅色/深色主题切换、跨平台 CI
- **v0.2** ✅ 语义分析：中文折扣、中文百分比、英文百分比、单位转换、数字提取求和
- **v0.3** ✅ 多工作表、本地持久化、导入导出（JSON/CSV/Markdown）
- **v0.4** ✅ 变量引用（l1/line2 + 命名变量）、聚合函数（平均/最大/最小/总和）
- **v0.5** ✅ UI 润色：自定义弹窗、关于对话框、应用图标、导出重构
- **v0.6** ✅ expr-eval 替换 mathjs（bundle -85%）、引用错误检测、中文大数单位、Tab 键导航
- **v0.7** ✅ 复合单位智能识别（1天20小时48分钟→1.87天）、单位切换器 UI、单单位也支持切换
- **v0.8** ✅ 撤销/重做（Ctrl+Z / Ctrl+Shift+Z）、文本防抖、焦点恢复
- **v0.9** ✅ 检查更新：启动自动检查 + 手动检查，支持三平台自动更新（Ed25519 签名验证）
- **v0.9.1** ✅ 检查更新合并到关于对话框，显示当前/最新版本对比，关于内一键更新
- **v0.10** ✅ 设置界面（字体/字号/主题/语言/小数位/千分位/Tab行为/保存目录/导出编码/默认导出格式）、中英双语 i18n

## License

MIT