<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from "vue";
import LineRow from "./components/LineRow.vue";
import SummaryBar from "./components/SummaryBar.vue";
import Sidebar from "./components/Sidebar.vue";
import ModalDialog from "./components/ModalDialog.vue";
import { buildLineResults } from "./composables/useVariables";
import { loadData, saveData } from "./composables/useStorage";
import { exportJSON, exportCSV, exportMarkdown, importJSON } from "./composables/useImportExport";
import type { Line, Worksheet, WorksheetData, LineResult } from "./types";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

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

// ===== 主题 =====
const theme = ref<"dark" | "light">("dark");

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme.value);
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
  lines.value[index].text = value;
}

async function newLine(index: number) {
  const item: Line = { id: nextLineId++, text: "" };
  lines.value.splice(index + 1, 0, item);
  await nextTick();
  lineRefs.value[index + 1]?.focus();
}

async function deleteLine(index: number) {
  if (lines.value.length <= 1) return;
  lines.value.splice(index, 1);
  const target = Math.max(0, index - 1);
  await nextTick();
  lineRefs.value[target]?.focus();
}

async function moveUp(index: number) {
  if (index > 0) {
    await nextTick();
    lineRefs.value[index - 1]?.focus();
  }
}

async function moveDown(index: number) {
  if (index < lines.value.length - 1) {
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
    name: name || `工作表 ${sheets.value.length + 1}`,
    lines: [{ id: nextLineId++, text: "" }],
  };
}

function addSheet() {
  const sheet = createSheet();
  sheets.value.push(sheet);
  activeSheetId.value = sheet.id;
}

function selectSheet(id: string) {
  activeSheetId.value = id;
  nextTick(() => lineRefs.value[0]?.focus());
}

function renameSheet(id: string, name: string) {
  const sheet = sheets.value.find((s) => s.id === id);
  if (sheet) sheet.name = name;
}

function deleteSheet(id: string) {
  if (sheets.value.length <= 1) return;
  const idx = sheets.value.findIndex((s) => s.id === id);
  if (idx === -1) return;
  sheets.value.splice(idx, 1);
  if (activeSheetId.value === id) {
    activeSheetId.value = sheets.value[Math.max(0, idx - 1)].id;
  }
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
  const filePath = await save({
    defaultPath: baseName,
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
  } else if (ext === "md") {
    content = exportMarkdown(activeSheet.value);
  } else {
    content = exportJSON(sheets.value);
  }

  await writeTextFile(filePath, content);
}

function doImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = importJSON(reader.result as string);
      if (imported && imported.length > 0) {
        sheets.value = imported;
        activeSheetId.value = imported[0].id;
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ===== 关于对话框 =====
const aboutVisible = ref(false);
const APP_VERSION = "0.5.0-alpha.1";

// ===== 初始化 =====
onMounted(async () => {
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
    const sheet = createSheet("工作表 1");
    sheets.value = [sheet];
    activeSheetId.value = sheet.id;
  }
  await nextTick();
  lineRefs.value[0]?.focus();

  // 禁用 WebView 原生右键菜单（去掉浏览器「另存为/打印/更多工具」等无用项）
  document.addEventListener("contextmenu", (e) => e.preventDefault());
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
          <button class="title-btn" @click="doExport" title="导出（JSON/CSV/MD）">导出</button>
          <button class="title-btn" @click="doImport" title="导入 JSON">导入</button>
          <button class="theme-toggle" @click="toggleTheme" title="切换主题">
            {{ theme === "dark" ? "\u2600" : "\u263d" }}
          </button>
          <button class="title-btn about-btn" @click="aboutVisible = true" title="关于">关于</button>
        </div>
      </header>

      <!-- 关于弹窗 -->
      <ModalDialog
        :visible="aboutVisible"
        mode="about"
        :version="APP_VERSION"
        author="yachen"
        email="bbwang@163.com"
        repo="https://github.com/yachen4ever/notecalc"
        @close="aboutVisible = false"
        @confirm="aboutVisible = false"
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
  font-size: 16px;
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

.worksheet {
  flex: 1;
  overflow-y: auto;
  padding-top: 4px;
}

footer {
  flex-shrink: 0;
}
</style>
