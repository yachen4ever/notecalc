---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '38aa1021-e895-4bd0-8aad-96713344a756'
  PropagateID: '38aa1021-e895-4bd0-8aad-96713344a756'
  ReservedCode1: 'cad79bfa-e95f-4e69-a280-8cd81b26049b'
  ReservedCode2: 'cad79bfa-e95f-4e69-a280-8cd81b26049b'
---

# notecalc

记事本风格的跨平台计算器，类似 Soulver / Numi。左边逐行输入算式或文字，右边实时展示结果，底部自动汇总。

## 功能

- 行式编辑器，逐行输入
- 实时计算，无需按钮触发
- 四则运算 + 括号（mathjs）
- 语法高亮：数字蓝色、运算符青色、纯文字灰色
- 结果右对齐，底部自动汇总
- 暗色主题

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
| notecalc-windows-x64.zip | Windows x64 |
| notecalc-windows-x86.zip | Windows x86 |
| notecalc-linux-amd64.tar.gz | Linux amd64 |
| notecalc-macos-arm64.tar.gz | macOS arm64 (Apple Silicon) |
| notecalc_*_amd64.deb | Linux amd64 (deb) |

## 路线图

- **V1** ✅ 四则运算+括号、行编辑器、实时结果、汇总、语法高亮、暗色主题
- **V2** 语义分析、单位转换、百分比运算
- **V3** 多工作表、本地持久化、导入导出
- **V4** 变量引用、行间依赖、自然语言增强

## License

MIT