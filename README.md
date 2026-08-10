---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '15fca9a4-53c4-47f7-9d3f-dc223394a2c1'
  PropagateID: '15fca9a4-53c4-47f7-9d3f-dc223394a2c1'
  ReservedCode1: 'f7ccd5fd-bc33-42e7-85eb-013a782f8b74'
  ReservedCode2: 'f7ccd5fd-bc33-42e7-85eb-013a782f8b74'
---

# notecalc

记事本风格的跨平台计算器，类似 Soulver / Numi。左边逐行输入算式或文字，右边实时展示结果，底部自动汇总。

## 功能

### V1 — 基础计算
- 行式编辑器，逐行输入
- 实时计算，无需按钮触发
- 四则运算 + 括号（mathjs）
- 语法高亮：数字蓝色、运算符青色、纯文字灰色
- 结果右对齐，底部自动汇总
- 浅色/深色主题切换

### V2 — 语义分析 ✅
- 中文折扣：打8折、半价、满200减50、涨10%、降10%
- 中文百分比：`120的15%` → 18、`120占800的百分比` → 15
- 英文百分比：10% off、10% of、200+10%、200-10%
- 单位转换：长度/重量/温度/面积/体积/时间 7 大类，`5km to mi`、`30摄氏度转华氏`、`100kg转斤`
- 数字提取求和：多段文字中的数字自动提取并相加（如“餐饮340 打车86”→ 426）
- 基于规则引擎实现，确定性、快速、离线，无需大模型

## 技术栈

| 组件 | 选择 |
|------|------|
| 应用框架 | Tauri 2 |
| 前端框架 | Vue 3 |
| 语言 | TypeScript |
| 样式 | TailwindCSS v4 |
| 表达式解析 | mathjs |
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

- **V1** ✅ 四则运算+括号、行编辑器、实时结果、汇总、语法高亮、浅色/深色主题切换
- **V2** ✅ 语义分析：中文折扣、中文百分比、英文百分比、单位转换、数字提取求和
- **V3** 多工作表、本地持久化、导入导出
- **V4** 变量引用、行间依赖、自然语言增强

## License

MIT