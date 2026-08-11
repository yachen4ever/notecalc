---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: 'e31a0e64-f9f9-4798-84c7-1dea101f171c'
  PropagateID: 'e31a0e64-f9f9-4798-84c7-1dea101f171c'
  ReservedCode1: '77e51683-69c1-4176-85e6-1e414593ffd7'
  ReservedCode2: '77e51683-69c1-4176-85e6-1e414593ffd7'
---

# notecalc

[中文](README.md) · [Changelog](CHANGELOG_EN.md)

A notepad-style cross-platform calculator, inspired by Soulver / Numi. Type calculations or text line by line on the left, see results instantly on the right, with automatic totals at the bottom.

![screenshot](https://cdn.jsdelivr.net/gh/yachen4ever/notecalc@main/docs/screenshot-dark.png)

## Features

### Basic Calculation
- Line-based editor — type line by line, Enter for new line, Backspace to delete empty lines
- Real-time calculation — results update as you type, no button needed
- Arithmetic + parentheses (expr-eval engine)
- Syntax highlighting — numbers in blue, operators in cyan, variables in purple, assignment in orange, plain text in gray
- Right-aligned results with automatic sum of all valid lines at the bottom
- Light / dark theme toggle

### Semantic Analysis
- Chinese discounts: `打8折` (20% off), `半价` (half price), `满200减50` (spend 200 save 50), `涨10%` (up 10%), `降10%` (down 10%)
- Chinese percentages: `120的15%` → 18, `120占800的百分比` → 15
- English percentages: `10% off 200` → 180, `10% of 200` → 20, `200 + 10%` → 220
- Unit conversion (7 categories, 60+ units): `5km to mi` → 3.11, `100kg转斤` → 200
- Compound unit normalization: `1天20小时48分钟` → 1.87 days, `1kg + 200g` → 1.2 kg — switch between same-category units in the result area
- Single unit switching: `1小时` → 1 hour, switchable to minutes/seconds/days
- Number extraction & sum: extract numbers from text and add them up (e.g. "lunch 340 taxi 86" → 426)
- Chinese large number units: `1万` → 10000, `3.5亿` → 350000000, `2万5` → 25000
- Rule-based engine — deterministic, fast, offline, no LLM required
- Decimals default to 2 places with trailing zeros stripped (3.14, 3.1, 3)

### Variables & References
- Line references: `l1` / `line2` to reference other lines' results
- Named variables: `price = 100`, then use `price * 12` in subsequent lines
- Aggregate functions: `平均` / `最大` / `最小` / `总和` (avg / max / min / sum)
- Reference error detection — forward refs, self-refs, out-of-bounds refs show ⚠ warning
- Variable name collision detection — `l1`, `line2` etc. are reserved

### Multi-Worksheet & Persistence
- Multi-worksheet sidebar — add / rename / switch / delete, each sheet has independent data
- Local persistence — auto-save (500ms debounce), survives restart (JSON file storage)
- Import / export — JSON full backup, CSV export, Markdown export
- Tab key to move focus between lines (Tab down, Shift+Tab up)

## Tech Stack

| Component | Choice |
|-----------|--------|
| App framework | Tauri 2 |
| Frontend | Vue 3 |
| Language | TypeScript |
| Styling | TailwindCSS v4 |
| Expression parser | expr-eval |
| Build tool | Vite |

## Development

```bash
npm install
npm run tauri dev
```

Build:

```bash
npm run tauri build
```

## Download

Get prebuilt binaries from [Releases](https://github.com/yachen4ever/notecalc/releases):

| Asset | Platform |
|-------|----------|
| notecalc-{version}-windows-x64.zip | Windows x64 |
| notecalc-{version}-windows-x86.zip | Windows x86 |
| notecalc-{version}-linux-amd64.tar.gz | Linux amd64 |
| notecalc-{version}-macos-arm64.tar.gz | macOS arm64 (Apple Silicon) |
| notecalc_{version}_amd64.deb | Linux amd64 (deb) |

## Roadmap

- **v0.1** ✅ Arithmetic + parentheses, line editor, real-time results, totals, syntax highlighting, light/dark theme, cross-platform CI
- **v0.2** ✅ Semantic analysis: Chinese discounts, Chinese/English percentages, unit conversion, number extraction
- **v0.3** ✅ Multi-worksheet, local persistence, import/export (JSON/CSV/Markdown)
- **v0.4** ✅ Variable references (l1/line2 + named variables), aggregate functions (avg/max/min/sum)
- **v0.5** ✅ UI polish: custom modal dialogs, about dialog, app icon, export refactor
- **v0.6** ✅ expr-eval replaces mathjs (bundle -85%), reference error detection, Chinese magnitude units, Tab navigation
- **v0.7** ✅ Compound unit recognition (1天20小时48分钟→1.87 days), unit switcher UI, single-unit switching

## License

MIT