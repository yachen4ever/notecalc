<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppSettings, ThemeMode, Language, TabBehavior, ExportEncoding, ExportFormat } from "../types";
import { FONT_PRESETS, FONT_SIZE_OPTIONS, DECIMAL_PLACE_OPTIONS } from "../composables/useSettings";
import { useI18n } from "../composables/useI18n";

const props = defineProps<{
  visible: boolean;
  settings: AppSettings;
}>();

const emit = defineEmits<{
  close: [];
  apply: [settings: AppSettings];
}>();

const { t } = useI18n();

// 本地副本（点"确定"才 emit 到父组件）
const local = ref<AppSettings>({ ...props.settings });

watch(
  () => props.visible,
  (v) => {
    if (v) {
      local.value = { ...props.settings };
    }
  },
);

// 是否有未保存的修改
const hasChanges = computed(() => {
  return JSON.stringify(local.value) !== JSON.stringify(props.settings);
});

function onApply() {
  emit("apply", { ...local.value });
  emit("close");
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
  }
}

// 浏览数据目录
async function browseDataDir() {
  const selected = await open({ directory: true, multiple: false });
  if (selected && typeof selected === "string") {
    local.value.dataDir = selected;
  }
}

// 主题选项
const themeOptions = computed<{ label: string; value: ThemeMode }[]>(() => [
  { label: t("themeDark"), value: "dark" },
  { label: t("themeLight"), value: "light" },
  { label: t("themeSystem"), value: "system" },
]);

// 语言选项
const langOptions = computed<{ label: string; value: Language }[]>(() => [
  { label: t("langZh"), value: "zh" },
  { label: t("langEn"), value: "en" },
]);

// Tab 行为选项
const tabOptions = computed<{ label: string; value: TabBehavior }[]>(() => [
  { label: t("tabNavigate"), value: "navigate" },
  { label: t("tabIndent"), value: "indent" },
]);

// 导出编码选项
const encodingOptions = computed<{ label: string; value: ExportEncoding }[]>(() => [
  { label: "UTF-8", value: "utf-8" },
  { label: "GBK", value: "gbk" },
]);

// 导出格式选项
const formatOptions = computed<{ label: string; value: ExportFormat }[]>(() => [
  { label: "JSON", value: "json" },
  { label: "CSV", value: "csv" },
  { label: "Markdown", value: "md" },
]);

// 切换开关
function toggleBoolean(key: "thousandsSeparator") {
  local.value[key] = !local.value[key];
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="settings-overlay" @click.self="emit('close')" @keydown="onKeydown">
      <div class="settings-box" role="dialog" :aria-label="t('settingsTitle')">
        <!-- 标题栏 -->
        <div class="settings-header">
          <span class="settings-title">{{ t("settingsTitle") }}</span>
          <button class="settings-close" @click="emit('close')">×</button>
        </div>

        <!-- 设置内容 -->
        <div class="settings-body">
          <!-- ===== 外观 ===== -->
          <div class="settings-section">
            <div class="section-title">{{ t("appearance") }}</div>

            <!-- 字体 -->
            <div class="settings-row">
              <label class="row-label">{{ t("font") }}</label>
              <select v-model="local.font" class="row-select">
                <option v-for="f in FONT_PRESETS" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
            </div>

            <!-- 字号 -->
            <div class="settings-row">
              <label class="row-label">{{ t("fontSize") }}</label>
              <select v-model.number="local.fontSize" class="row-select row-select-sm">
                <option v-for="s in FONT_SIZE_OPTIONS" :key="s" :value="s">{{ s }} {{ t("px") }}</option>
              </select>
            </div>

            <!-- 主题 -->
            <div class="settings-row">
              <label class="row-label">{{ t("theme") }}</label>
              <div class="option-group">
                <button
                  v-for="opt in themeOptions"
                  :key="opt.value"
                  :class="['option-btn', { active: local.theme === opt.value }]"
                  @click="local.theme = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>

          <!-- ===== 行为 ===== -->
          <div class="settings-section">
            <div class="section-title">{{ t("behavior") }}</div>

            <!-- 界面语言 -->
            <div class="settings-row">
              <label class="row-label">{{ t("language") }}</label>
              <div class="option-group">
                <button
                  v-for="opt in langOptions"
                  :key="opt.value"
                  :class="['option-btn', { active: local.language === opt.value }]"
                  @click="local.language = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- 小数位数 -->
            <div class="settings-row">
              <label class="row-label">{{ t("decimalPlaces") }}</label>
              <select v-model.number="local.decimalPlaces" class="row-select row-select-sm">
                <option v-for="d in DECIMAL_PLACE_OPTIONS" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>

            <!-- 千分位分隔符 -->
            <div class="settings-row">
              <label class="row-label">{{ t("thousandsSeparator") }}</label>
              <div class="toggle-switch" @click="toggleBoolean('thousandsSeparator')">
                <div :class="['toggle-knob', { on: local.thousandsSeparator }]"></div>
              </div>
            </div>

            <!-- Tab 键行为 -->
            <div class="settings-row">
              <label class="row-label">{{ t("tabBehavior") }}</label>
              <div class="option-group">
                <button
                  v-for="opt in tabOptions"
                  :key="opt.value"
                  :class="['option-btn', { active: local.tabBehavior === opt.value }]"
                  @click="local.tabBehavior = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>

          <!-- ===== 数据 ===== -->
          <div class="settings-section">
            <div class="section-title">{{ t("data") }}</div>

            <!-- 保存目录 -->
            <div class="settings-row">
              <label class="row-label">{{ t("dataDir") }}</label>
              <div class="dir-row">
                <span class="dir-value" :title="local.dataDir || t('dataDirDefault')">
                  {{ local.dataDir || t("dataDirDefault") }}
                </span>
                <button class="browse-btn" @click="browseDataDir">{{ t("browse") }}</button>
                <button v-if="local.dataDir" class="reset-btn" @click="local.dataDir = ''">↺</button>
              </div>
            </div>

            <!-- 导出编码 -->
            <div class="settings-row">
              <label class="row-label">{{ t("exportEncoding") }}</label>
              <div class="option-group">
                <button
                  v-for="opt in encodingOptions"
                  :key="opt.value"
                  :class="['option-btn', { active: local.exportEncoding === opt.value }]"
                  @click="local.exportEncoding = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- 默认导出格式 -->
            <div class="settings-row">
              <label class="row-label">{{ t("defaultExportFormat") }}</label>
              <div class="option-group">
                <button
                  v-for="opt in formatOptions"
                  :key="opt.value"
                  :class="['option-btn', { active: local.defaultExportFormat === opt.value }]"
                  @click="local.defaultExportFormat = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="settings-actions">
          <button class="settings-btn settings-btn-cancel" @click="emit('close')">{{ t("cancel") }}</button>
          <button class="settings-btn settings-btn-ok" :disabled="!hasChanges" @click="onApply">{{ t("ok") }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settings-box {
  background: var(--bg-titlebar);
  border: 1px solid var(--border-titlebar);
  border-radius: 10px;
  width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.15s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-titlebar);
  flex-shrink: 0;
}

.settings-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 4px;
  line-height: 1;
  border-radius: 4px;
}

.settings-close:hover {
  color: var(--text-primary);
  background: var(--bg-row-hover);
}

.settings-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  gap: 12px;
}

.row-label {
  font-size: 13px;
  color: var(--text-primary);
  flex-shrink: 0;
}

.row-select {
  padding: 4px 8px;
  font-size: 12px;
  font-family: inherit;
  background: var(--bg-body);
  color: var(--text-primary);
  border: 1px solid var(--border-row);
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  min-width: 120px;
  transition: border-color 0.15s;
}

.row-select:focus {
  border-color: var(--accent);
}

.row-select-sm {
  min-width: 80px;
}

/* 按钮组 */
.option-group {
  display: flex;
  gap: 4px;
}

.option-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-family: inherit;
  background: var(--bg-row-hover);
  color: var(--text-muted);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.1s;
}

.option-btn:hover {
  color: var(--text-primary);
}

.option-btn.active {
  background: var(--accent);
  color: #000;
  font-weight: 500;
}

/* 切换开关 */
.toggle-switch {
  width: 36px;
  height: 20px;
  background: var(--bg-body);
  border: 1px solid var(--border-row);
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
}

.toggle-knob {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--text-muted);
  position: absolute;
  top: 2px;
  left: 3px;
  transition: all 0.2s;
}

.toggle-knob.on {
  background: #000;
  left: 17px;
}

.toggle-switch:has(.toggle-knob.on) {
  background: var(--accent);
  border-color: var(--accent);
}

/* 目录选择 */
.dir-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: flex-end;
}

.dir-value {
  font-size: 11px;
  color: var(--text-muted);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browse-btn {
  padding: 3px 10px;
  font-size: 11px;
  font-family: inherit;
  background: var(--bg-row-hover);
  color: var(--text-muted);
  border: 1px solid var(--border-row);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.1s;
}

.browse-btn:hover {
  color: var(--text-primary);
}

.reset-btn {
  padding: 3px 8px;
  font-size: 12px;
  background: var(--bg-row-hover);
  color: var(--text-muted);
  border: 1px solid var(--border-row);
  border-radius: 6px;
  cursor: pointer;
  line-height: 1;
}

.reset-btn:hover {
  color: var(--text-primary);
}

/* 底部按钮 */
.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-titlebar);
  flex-shrink: 0;
}

.settings-btn {
  padding: 6px 20px;
  font-size: 12px;
  font-family: inherit;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.1s;
  font-weight: 500;
}

.settings-btn-cancel {
  background: var(--bg-row-hover);
  color: var(--text-muted);
}

.settings-btn-cancel:hover {
  background: var(--border-row);
  color: var(--text-primary);
}

.settings-btn-ok {
  background: var(--accent);
  color: #000;
}

.settings-btn-ok:hover {
  opacity: 0.85;
}

.settings-btn-ok:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
