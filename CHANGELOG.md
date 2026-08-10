---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'a8122bee-9aef-4c7c-b1b8-729a06ac07a2'
  PropagateID: 'a8122bee-9aef-4c7c-b1b8-729a06ac07a2'
  ReservedCode1: 'ae5a4011-ff2b-4e78-aca2-9d892d4d430f'
  ReservedCode2: 'ae5a4011-ff2b-4e78-aca2-9d892d4d430f'
---

# 更新日志

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