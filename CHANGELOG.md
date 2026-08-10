---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'fbeca331-43b3-4050-82f7-615bb96c35bb'
  PropagateID: 'fbeca331-43b3-4050-82f7-615bb96c35bb'
  ReservedCode1: '0f911130-2069-4876-b6fe-860ab54aa286'
  ReservedCode2: '0f911130-2069-4876-b6fe-860ab54aa286'
---

# 更新日志

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