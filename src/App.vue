<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch, onUnmounted } from "vue";
import LineRow from "./components/LineRow.vue";
import SummaryBar from "./components/SummaryBar.vue";
import Sidebar from "./components/Sidebar.vue";
import ModalDialog from "./components/ModalDialog.vue";
import SettingsDialog from "./components/SettingsDialog.vue";
import { buildLineResults } from "./composables/useVariables";
import { loadData, saveData } from "./composables/useStorage";
import { exportJSON, exportCSV, exportMarkdown, importJSON, writeFileWithEncoding } from "./composables/useImportExport";
import { useUndoRedo } from "./composables/useUndoRedo";
import { useUpdater } from "./composables/useUpdater";
import { APP_VERSION } from "./composables/useVersion";
import { useSettings, loadSettings, saveSettings } from "./composables/useSettings";
import { useI18n, setLanguage } from "./composables/useI18n";
import { setFormatOptions } from "./composables/useCalculator";
import type { Line, Worksheet, WorksheetData, LineResult, AppSettings, ThemeMode } from "./types";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

// ===== 工作表数据 =====
let nextLineId = 1;

const sheets = ref<Worksheet[]>([]);
const activeSheetId = ref("");

const activeSheet = computed(() =>
  sheets.value.find((s) => s.id === activeSheetId.value) ?? sheets.value[0]
);

const lines = computed(() => activeSheet.value?.lines ?? []);

// 行 ref 引用
const lineRefs = ref<Array<InstanceType<typeof LineRow> | null>>([]);

// ===== Undo/Redo 历史 =====
const { canUndo, canRedo, pushHistory, undo, redo, clearHistory } = useUndoRedo();

// 当前焦点行索引（用于 undo/redo 后恢复焦点）
let currentFocusIndex = 0;

// 文本输入防抖定时器
let textDebounceTimer: ReturnType<typeof setTimeout> | null = null;
// 防抖期间是否已有待提交的历史快照
let textDebouncePending = false;

/** 记录文本编辑历史（防抖：500ms 内连续输入只记一次） */
function pushTextHistory() {
  if (textDebouncePending) return;
  textDebouncePending = true;
  pushHistory(sheets.value, activeSheetId.value, currentFocusIndex);
  if (textDebounceTimer) clearTimeout(textDebounceTimer);
  textDebounceTimer = setTimeout(() => {
    textDebouncePending = false;
    textDebounceTimer = null;
  }, 500);
}

// ===== 设置 =====
const settings = useSettings();
const { t } = useI18n();
const settingsVisible = ref(false);

/** 应用设置到 UI 和计算引擎 */
function applySettings(s: AppSettings) {
  // 字体
  document.documentElement.style.setProperty("--app-font", s.font);
  document.documentElement.style.setProperty("--app-font-size", `${s.fontSize}px`);

  // 主题
  applyTheme(s.theme);

  // 语言
  setLanguage(s.language);

  // 计算格式化选项
  setFormatOptions(s.decimalPlaces, s.thousandsSeparator);
}

/** 应用主题（支持 system 模式） */
function applyTheme(mode: ThemeMode) {
  let effective: "dark" | "light";
  if (mode === "system") {
    effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    effective = mode;
  }
  document.documentElement.setAttribute("data-theme", effective);
}

// 监听系统主题变化（仅 system 模式下生效）
let mediaQuery: MediaQueryList | null = null;
function onSystemThemeChange() {
  if (settings.value.theme === "system") {
    applyTheme("system");
  }
}

function openSettings() {
  settingsVisible.value = true;
}

function handleApplySettings(newSettings: AppSettings) {
  settings.value = newSettings;
  applySettings(newSettings);
  saveSettings(newSettings);
}

// ===== 计算汇总（V4：含变量引用的完整构建） =====
const lineResults = computed(() => buildLineResults(lines.value));

const summary = computed(() => {
  let total = 0;
  let count = 0;
  for (const r of lineResults.value) {
    if (r.result !== null) {
      total += r.result;
      count++;
    }
  }
  return { total: count > 0 ? total : null, count };
});

// ===== 行操作 =====
function updateText(index: number, value: string) {
  pushTextHistory();
  lines.value[index].text = value;
}

async function newLine(index: number) {
  // 如果有防抖中的文本历史，先清除（结构操作会立即记录自己的快照）
  if (textDebounceTimer) {
    clearTimeout(textDebounceTimer);
    textDebouncePending = false;
  }
  pushHistory(sheets.value, activeSheetId.value, index);
  currentFocusIndex = index + 1;
  const item: Line = { id: nextLineId++, text: "" };
  lines.value.splice(index + 1, 0, item);
  await nextTick();
  lineRefs.value[index + 1]?.focus();
}

async function deleteLine(index: number) {
  if (lines.value.length <= 1) return;
  if (textDebounceTimer) {
    clearTimeout(textDebounceTimer);
    textDebouncePending = false;
  }
  pushHistory(sheets.value, activeSheetId.value, index);
  currentFocusIndex = Math.max(0, index - 1);
  lines.value.splice(index, 1);
  const target = Math.max(0, index - 1);
  await nextTick();
  lineRefs.value[target]?.focus();
}

async function moveUp(index: number) {
  if (index > 0) {
    currentFocusIndex = index - 1;
    await nextTick();
    lineRefs.value[index - 1]?.focus();
  }
}

async function moveDown(index: number) {
  if (index < lines.value.length - 1) {
    currentFocusIndex = index + 1;
    await nextTick();
    lineRefs.value[index + 1]?.focus();
  } else {
    await newLine(index);
  }
}

// ===== 工作表操作 =====
function createSheet(name?: string): Worksheet {
  const id = `sheet_${Date.now()}`;
  return {
    id,
    name: name || `${t("worksheet")} ${sheets.value.length + 1}`,
    lines: [{ id: nextLineId++, text: "" }],
  };
}

function addSheet() {
  pushHistory(sheets.value, activeSheetId.value, 0);
  const sheet = createSheet();
  sheets.value.push(sheet);
  activeSheetId.value = sheet.id;
  currentFocusIndex = 0;
}

function selectSheet(id: string) {
  activeSheetId.value = id;
  currentFocusIndex = 0;
  nextTick(() => lineRefs.value[0]?.focus());
}

function renameSheet(id: string, name: string) {
  pushHistory(sheets.value, activeSheetId.value, currentFocusIndex);
  const sheet = sheets.value.find((s) => s.id === id);
  if (sheet) sheet.name = name;
}

function deleteSheet(id: string) {
  if (sheets.value.length <= 1) return;
  const idx = sheets.value.findIndex((s) => s.id === id);
  if (idx === -1) return;
  pushHistory(sheets.value, activeSheetId.value, 0);
  sheets.value.splice(idx, 1);
  if (activeSheetId.value === id) {
    activeSheetId.value = sheets.value[Math.max(0, idx - 1)].id;
  }
  currentFocusIndex = 0;
}

// ===== 持久化 =====
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const data: WorksheetData = {
      sheets: sheets.value,
      active_sheet_id: activeSheetId.value,
    };
    await saveData(data);
  }, 500);
}

// 监听数据变化，自动保存
watch([sheets, activeSheetId], scheduleSave, { deep: true });

// ===== 导入导出 =====
async function doExport() {
  const baseName = activeSheet.value.name;
  const defaultFmt = settings.value.defaultExportFormat;
  const filePath = await save({
    defaultPath: `${baseName}.${defaultFmt}`,
    filters: [
      { name: "JSON", extensions: ["json"] },
      { name: "CSV", extensions: ["csv"] },
      { name: "Markdown", extensions: ["md"] },
    ],
  });
  if (!filePath) return; // 用户取消

  const ext = filePath.split(".").pop()?.toLowerCase();
  let content = "";
  if (ext === "csv") {
    content = exportCSV(activeSheet.value);
    // CSV 按设置编码写入
    const encoding = settings.value.exportEncoding === "gbk" ? "gbk" : "utf-8-bom";
    await writeFileWithEncoding(filePath, content, encoding);
    return;
  } else if (ext === "md") {
    content = exportMarkdown(activeSheet.value);
  } else {
    content = exportJSON(sheets.value);
  }

  await writeTextFile(filePath, content);
}

async function doImport() {
  const filePath = await open({
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!filePath || typeof filePath !== "string") return;

  const content = await readTextFile(filePath);
  const imported = importJSON(content);
  if (imported && imported.length > 0) {
    pushHistory(sheets.value, activeSheetId.value, 0);
    sheets.value = imported;
    activeSheetId.value = imported[0].id;
    currentFocusIndex = 0;
  }
}

// ===== 关于对话框 + 检查更新 =====
const aboutVisible = ref(false);

const {
  status: updateStatus,
  updateInfo,
  progress: updateProgress,
  errorMsg: updateErrorMsg,
  checkForUpdate,
  downloadAndInstall,
  restartApp,
  reset: resetUpdate,
} = useUpdater();

// 静默自动检查（启动后 3 秒）
onMounted(() => {
  setTimeout(() => {
    checkForUpdate(true);
  }, 3000);
});

// 打开关于对话框时，如果没有检查过更新，自动检查
function openAbout() {
  aboutVisible.value = true;
  if (updateStatus.value === "idle") {
    checkForUpdate(false);
  }
}

function handleCloseAbout() {
  aboutVisible.value = false;
  // 如果不是下载/安装中，重置状态（下次打开重新检查）
  if (updateStatus.value !== "downloading" && updateStatus.value !== "installing" && updateStatus.value !== "ready") {
    resetUpdate();
  }
}

async function handleDownloadUpdate() {
  await downloadAndInstall();
}

async function handleRestartNow() {
  aboutVisible.value = false;
  await restartApp();
}

// ===== Undo / Redo =====
async function doUndo() {
  // 如果有防抖中的文本历史，先提交
  if (textDebounceTimer) {
    clearTimeout(textDebounceTimer);
    textDebouncePending = false;
  }
  const snapshot = undo(sheets.value, activeSheetId.value, currentFocusIndex);
  if (!snapshot) return;

  sheets.value = snapshot.sheets;
  activeSheetId.value = snapshot.activeSheetId;
  currentFocusIndex = snapshot.focusIndex;

  // 恢复 nextLineId（防止 id 冲突）
  const maxId = Math.max(
    ...sheets.value.flatMap((s) => s.lines.map((l) => l.id)),
    0
  );
  nextLineId = maxId + 1;

  await nextTick();
  const targetIndex = Math.min(currentFocusIndex, lines.value.length - 1);
  if (targetIndex >= 0) {
    lineRefs.value[targetIndex]?.focus();
  }
}

async function doRedo() {
  const snapshot = redo(sheets.value, activeSheetId.value, currentFocusIndex);
  if (!snapshot) return;

  sheets.value = snapshot.sheets;
  activeSheetId.value = snapshot.activeSheetId;
  currentFocusIndex = snapshot.focusIndex;

  // 恢复 nextLineId
  const maxId = Math.max(
    ...sheets.value.flatMap((s) => s.lines.map((l) => l.id)),
    0
  );
  nextLineId = maxId + 1;

  await nextTick();
  const targetIndex = Math.min(currentFocusIndex, lines.value.length - 1);
  if (targetIndex >= 0) {
    lineRefs.value[targetIndex]?.focus();
  }
}

// 全局键盘拦截：Ctrl+Z 撤销，Ctrl+Shift+Z / Ctrl+Y 重做
function onGlobalKeydown(e: KeyboardEvent) {
  // modal 打开时不拦截
  if (aboutVisible.value) return;
  if (settingsVisible.value) return;
  if (document.querySelector(".modal-overlay")) return;
  if (document.querySelector(".settings-overlay")) return;

  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    doUndo();
  } else if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === "z") || e.key === "y")) {
    e.preventDefault();
    doRedo();
  }
}

// ===== 初始化 =====
onMounted(async () => {
  // 加载设置并应用
  const s = await loadSettings();
  applySettings(s);

  // 设置系统主题监听
  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onSystemThemeChange);

  const data = await loadData();
  if (data && data.sheets.length > 0) {
    sheets.value = data.sheets;
    activeSheetId.value = data.active_sheet_id || data.sheets[0].id;
    // 恢复 nextLineId
    const maxId = Math.max(
      ...data.sheets.flatMap((s) => s.lines.map((l) => l.id)),
      0
    );
    nextLineId = maxId + 1;
  } else {
    const sheet = createSheet(`${t("worksheet")} 1`);
    sheets.value = [sheet];
    activeSheetId.value = sheet.id;
  }
  await nextTick();
  lineRefs.value[0]?.focus();

  // 禁用 WebView 原生右键菜单（去掉浏览器「另存为/打印/更多工具」等无用项）
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // 全局键盘拦截（Undo/Redo）
  document.addEventListener("keydown", onGlobalKeydown);

  // 初始化完成后清空历史栈（初始状态不入栈）
  clearHistory();
});

onUnmounted(() => {
  document.removeEventListener("keydown", onGlobalKeydown);
  if (mediaQuery) {
    mediaQuery.removeEventListener("change", onSystemThemeChange);
  }
});
</script>

<template>
  <div class="app">
    <!-- 侧边栏 -->
    <Sidebar
      :sheets="sheets"
      :active-sheet-id="activeSheetId"
      @select-sheet="selectSheet"
      @add-sheet="addSheet"
      @rename-sheet="renameSheet"
      @delete-sheet="deleteSheet"
    />

    <!-- 主区域 -->
    <div class="main">
      <!-- 标题栏 -->
      <header class="title-bar" data-tauri-drag-region>
        <div class="title-left">
          <span class="sheet-name-badge">{{ activeSheet?.name }}</span>
        </div>
        <div class="title-right">
          <button class="title-btn" @click="doUndo" :disabled="!canUndo" :title="t('undo') + ' (Ctrl+Z)'">↶</button>
          <button class="title-btn" @click="doRedo" :disabled="!canRedo" :title="t('redo') + ' (Ctrl+Shift+Z)'">↷</button>
          <span class="title-divider"></span>
          <button class="title-btn" @click="doExport" :title="t('export') + ' (JSON/CSV/MD)'">{{ t("export") }}</button>
          <button class="title-btn" @click="doImport" :title="t('import') + ' JSON'">{{ t("import") }}</button>
          <button class="theme-toggle" @click="openSettings" :title="t('settings')">⚙</button>
          <button class="title-btn about-btn" @click="openAbout" :title="t('about')">{{ t("about") }}</button>
        </div>
      </header>

      <!-- 关于弹窗（含检查更新） -->
      <ModalDialog
        :visible="aboutVisible"
        mode="about"
        :version="APP_VERSION"
        :latest-version="updateInfo?.version"
        :update-status="updateStatus"
        :update-progress="updateProgress"
        :error-msg="updateErrorMsg"
        author="yachen"
        email="bbwang@163.com"
        repo="https://github.com/yachen4ever/notecalc"
        @close="handleCloseAbout"
        @download-update="handleDownloadUpdate"
        @restart-app="handleRestartNow"
      />

      <!-- 设置弹窗 -->
      <SettingsDialog
        :visible="settingsVisible"
        :settings="settings"
        @close="settingsVisible = false"
        @apply="handleApplySettings"
      />

      <!-- 工作区 -->
      <main class="worksheet">
        <LineRow
          v-for="(line, index) in lines"
          :key="line.id"
          :ref="(el) => (lineRefs[index] = el as InstanceType<typeof LineRow> | null)"
          :index="index"
          :text="line.text"
          :result="lineResults[index] as LineResult"
          :tab-behavior="settings.tabBehavior"
          @update:text="(val) => updateText(index, val)"
          @new-line="newLine(index)"
          @delete-line="deleteLine(index)"
          @move-up="moveUp(index)"
          @move-down="moveDown(index)"
        />
      </main>

      <!-- 汇总栏 -->
      <footer>
        <SummaryBar :total="summary.total" :count="summary.count" />
      </footer>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: row;
  height: 100vh;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title-bar {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background-color: var(--bg-titlebar);
  border-bottom: 1px solid var(--border-titlebar);
  -webkit-app-region: drag;
}

.title-left {
  display: flex;
  align-items: center;
}

.sheet-name-badge {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.title-right {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.title-btn {
  background: none;
  border: none;
  font-size: 11px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
  font-family: inherit;
}

.title-btn:hover {
  background-color: var(--bg-row-hover);
  color: var(--text-primary);
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
  line-height: 1;
}

.theme-toggle:hover {
  background-color: var(--bg-row-hover);
  color: var(--text-primary);
}

.about-btn {
  margin-left: 4px;
  border-left: 1px solid var(--border-titlebar);
  padding-left: 12px;
}

.title-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.title-divider {
  width: 1px;
  height: 16px;
  background-color: var(--border-titlebar);
  margin: 0 4px;
}

.worksheet {
  flex: 1;
  overflow-y: auto;
  padding-top: 4px;
}

footer {
  flex-shrink: 0;
}
</style>
