---
AIGC:
  ContentProducer: '001191110102MAD55U9H0F10002'
  ContentPropagator: '001191110102MAD55U9H0F10002'
  Label: '1'
  ProduceID: '700bd92e-a37e-40a8-bfb8-91cde2e991e9'
  PropagateID: '700bd92e-a37e-40a8-bfb8-91cde2e991e9'
  ReservedCode1: 'fcaa46dc-d887-4248-9575-b6c116a5c1e2'
  ReservedCode2: 'fcaa46dc-d887-4248-9575-b6c116a5c1e2'
---

# Changelog

## v0.9.1 (2026-08-13)

### Improvements

- **Merged update check into About dialog**: Removed standalone "Check for Updates" button from toolbar; update functionality now lives in the About dialog
  - About dialog shows current version and latest version side by side for easy comparison
  - When a newer version is available, latest version is highlighted and an "Update Now" button appears
  - Download progress bar displayed inline within About dialog; changes to "Restart Now" after completion
  - Automatically checks for updates when About is opened (if not checked yet)
  - Startup silent check (3s delay) remains unchanged

## v0.9.0 (2026-08-12)

### New Features

- **Auto-update**: Silent update check on app launch (3s delay), or manually via the "Check for Updates" button in the toolbar
  - Powered by Tauri v2 Updater plugin, checks version from Gitee-hosted `latest.json`
  - Update dialog shows version number and release notes, with one-click download, install, and automatic restart
  - Real-time download progress display, auto-restart after installation
  - Update packages verified with Ed25519 signatures for integrity
  - Supports macOS (.app.tar.gz), Windows (NSIS -setup.exe), and Linux (.AppImage) auto-update

### Technical Details

- Added `tauri-plugin-updater` + `tauri-plugin-process` plugins
- Added `useVersion.ts` for unified version management, `useUpdater.ts` wrapping check/download/install/relaunch logic
- CI auto-collects per-platform signature files and generates `latest.json`, uploaded to both GitHub Release and Gitee Release
- Generated Ed25519 signing keypair — public key embedded in `tauri.conf.json`, private key stored in GitHub Secrets

## v0.8.1 (2026-08-12)

### Fixes

- **Compound unit supports subtraction**: `1天-10小时` → 0.58 days (previously the minus sign was ignored and everything was added, giving 1.42 days). Supports `+`/`-`/space as delimiters and mixed usage (e.g. `1天 - 2小时 + 30分钟`)

## v0.8.0 (2026-08-12)

### New Features

- **Undo/Redo**: Support Ctrl+Z to undo, Ctrl+Shift+Z / Ctrl+Y to redo, covering all data operations (text editing, add/delete lines, add/delete sheets, rename, import)
- **Text input debounce**: Consecutive typing only records one history snapshot (500ms interval), preventing the undo stack from being flooded by individual keystrokes
- **Toolbar undo/redo buttons**: ↶ / ↷ buttons with disabled-state visual feedback
- **Focus restoration**: Automatically restores focus to the line that was focused before undo/redo
- **History stack limit**: Retains up to 100 steps of operation history

## v0.7.1 (2026-08-12)

### UX Improvements

- **Default 2 decimal places**: `formatNumber` changed from 6 to 2 places, trailing zeros stripped (3.14, 3.1, 3, 10/3→3.33)
- **Single-unit inputs now recognized**: `1小时`, `5km`, `100kg` etc. now trigger unit recognition with switchable display (compoundUnitRule threshold changed from <2 to <1)
- **README screenshot fix**: switched to jsDelivr CDN to resolve `raw.githubusercontent.com` being blocked in China
- **README roadmap version alignment**: V1-V6 renamed to v0.1-v0.7 to match actual tags
- **README links**: added CHANGELOG.md and English README links below the title
- **English documentation**: README_EN.md + CHANGELOG_EN.md added

#### Tests

- All 184 unit tests pass (10 test files)
- New: 3 single-unit trigger tests (1小时/5km/100kg)

---

## v0.7.0 (2026-08-11)

### V6 Compound Unit Recognition + UI Polish

#### New Features

- **Compound unit normalization**: enter combinations of same-category units, auto-normalized to base value
  - `1天20小时48分钟` → `1.87 天` (no longer mis-extracted as 69)
  - `1kg + 200g` → `1.2 千克`
  - `1km 500m 20cm` → `1.5 千米`
  - `2L 500ml` → `2.5 升`
  - `5英尺 6英寸` → `1.68 米`
- **Unit switcher UI**: ▾ arrow in result area, hover to switch between same-category units
  - Time: days / hours / minutes / seconds / milliseconds
  - Weight: tons / kg / g / mg / lb / oz / 斤 / 两 / 钱
  - Length: km / m / cm / mm / miles / feet / inches / yards / 里 / 丈 / 尺 / 寸 / nautical miles
  - Area: km² / m² / cm² / hectares / 亩 / acres / ft²
  - Volume: L / mL / gallons / cups
- New `compoundUnitRule` in rule engine, placed after `unitConversionRule`
- `getUnitLabel` prefers Chinese names (千克 over kg, 千米 over km)
- Supports both `+` and space as separators

#### Tests

- All 184 unit tests pass (10 test files)
- New: 18 compound unit tests (time/weight/length/volume, `+` separator, single-unit, edge cases, unitInfo structure)

---

## v0.6.0 (2026-08-11)

### V5 Performance + Robustness + UX Improvements

#### Performance

- **Replaced mathjs with expr-eval**: mathjs accounted for 93% of bundle (757KB), but only `evaluate()` was used for arithmetic
  - After switching to expr-eval (6KB), bundle dropped from 757KB to 116KB (gzip 43KB), a 85% reduction

#### Robustness

- **Fixed numberExtractionRule false triggers**: text with semantic keywords (比/少/多/平均/次方 etc.) no longer blindly extracts numbers for summation
- **Forward/self/out-of-bounds reference detection**: previously silently replaced with 0, now reports errors (⚠ UI warning with hover tooltip)
- **Chinese magnitude units 万/亿**: `1万` → 10000, `3.5亿` → 350000000, `2万5` → 25000
- **Variable name collision detection**: defining `l1 = 42` conflicts with line reference system, now detected and reported
- **formatNumber(-0) fix**: `value === 0` returns `"0"` directly, avoids showing `-0`

#### UX Improvements

- **Import uses Tauri dialog**: `open()` + `readTextFile()`, replaces unsupported `a.download` + Blob URL
- **About dialog links**: `@tauri-apps/plugin-opener` `openUrl()` replaces non-functional `target="_blank"`
- **Tab key navigation**: Tab → move down, Shift+Tab → move up (previously Tab exited the editor)
- **Error line visual feedback**: ⚠ icon + red highlight + title tooltip

#### Tests

- All 166 unit tests pass (9 test files)
- New tests: numberExtraction semantic keywords (1), reference errors (7), Chinese magnitude (6), variable collision (2)

---

## v0.5.0-alpha.1 (2026-08-11)

### Fixes + Improvements

- Fix: export not working (Tauri WebView doesn't support `a.download` + Blob URL) — switched to `tauri-plugin-dialog` save dialog + `tauri-plugin-fs` write
- Merge: JSON / CSV / MD export buttons combined into single "Export" with file type selection
- New: disabled WebView native right-click menu
- Improvement: About dialog icon changed from emoji to real app icon
- New dependencies: `@tauri-apps/plugin-dialog` + `@tauri-apps/plugin-fs`

---

## v0.4.0-alpha.2 (2026-08-11)

### V4.5 UI Polish

- New: custom modal dialog component `ModalDialog.vue`, replacing native `prompt`/`confirm`, fixing title display issue
- New: About dialog (version / author / email / GitHub repo)
- New: new app icon (notepad + calculator fusion design)

---

## v0.4.0-alpha.1 (2026-08-11)

### V4 Variable References + Line Dependencies + Aggregate Functions

- New: line references `l1` / `line2` to reference other lines' results
- New: named variables `price = 100`, then use `price * 12`
- New: aggregate functions (avg/max/min/sum), Chinese and English keywords
  - `平均 100 200 300` → 200, `最大 34 56 78` → 78, `sum 10 20 30` → 60
- New: syntax highlighting for variable references (purple) and assignment (orange)
- Refactor: `buildLineResults` computes entire worksheet, supports variable context passing
- Refactor: `LineRow` accepts `result` prop, no longer calculates independently
- Refactor: export functions use `buildLineResults` for correct variable reference handling

---

## v0.3.0-alpha.1 (2026-08-11)

### V3 Multi-Worksheet + Persistence + Import/Export

- New: multi-worksheet sidebar (add / rename / switch / delete), independent data per sheet
- New: local persistence, auto-save to `app_data_dir/notecalc.json`, 500ms debounce
- New: import/export (JSON full backup, CSV single-sheet, Markdown single-sheet)
- New: Rust backend `load_data` / `save_data` commands
- Adjusted: window default 720×520 → 960×600, min 480×360 → 640×400 (sidebar 180px)

---

## v0.2.0 (2026-08-11)

### V2 Semantic Analysis

- New: Chinese percentage (`120的15%` → 18, `120占800的百分比` → 15, `120的百分之15` → 18)
- New: unit conversion rule engine, 7 categories:
  - Length: km/m/cm/mm, mi/ft/in/yd, 里/丈/尺/寸, nautical miles
  - Weight: t/kg/g/mg, lb/oz, 斤/两/钱
  - Temperature: Celsius/Fahrenheit/Kelvin (non-linear special conversion)
  - Area: km²/m²/cm², ha/亩, acre/ft²
  - Volume: L/mL, gal/cup
  - Time: ms/s/min/h/day
  - Syntax: `5km to mi`, `30摄氏度转华氏`, `100kg转斤`
- New: light/dark theme toggle (v0.2-alpha.3)

---

## v0.2-alpha.3 (2026-08-11)

- Light/dark theme toggle: CSS variables for unified theme management, smooth transition animation

---

## v0.2-alpha.2 (2026-08-11)

- CI dynamic versioning: extract from git tag, write to tauri.conf.json and package.json
- Semver normalization: `0.2-alpha.2` → `0.2.0-alpha.2` (Tauri requires three-segment semver)
- Windows MSI compatibility: strip `alpha` suffix for MSI builds
- Artifact filenames with version: notecalc-{version}-{label} format
- README updated with V2 semantic analysis features

---

## v0.2-alpha.1 (2026-08-11)

- Semantic analysis rule engine (bilingual), multi-level calculation pipeline
- Chinese discounts: 打8折 / 半价 / 满200减50 / 涨10% / 降10%
- English percentages: 10% off 200 / 10% of 200 / 200 + 10% / 200 - 10%
- Number extraction & sum: 餐饮340 打车86 → 426
- Rule engine architecture (composables/rules/), extensible

---

## v0.1-alpha.2 (2026-08-10)

- Syntax highlighting overlay: numbers blue, operators cyan, plain text gray
- Transparent input text with visible caret, editing experience unaffected
- GitHub Actions cross-platform CI/CD (auto build & release on tag push)

---

## v0.1-alpha.1 (2026-08-10)

- Line editor: Enter for new line, Backspace to delete empty line, arrow keys to navigate
- Real-time calculation: mathjs for arithmetic + parentheses
- Right-aligned results: CSS Grid 3-column layout (line number | input | result)
- Bottom totals: auto-sum of all valid result lines
- Dark theme: minimal dark style, monospace font
- Tech stack: Tauri 2 + Vue 3 + TypeScript + TailwindCSS v4 + mathjs