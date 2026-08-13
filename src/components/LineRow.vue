<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { tokenize, formatNumber } from "../composables/useCalculator";
import type { LineResult } from "../types";

const props = defineProps<{
  index: number;
  text: string;
  result?: LineResult;
  tabBehavior?: "navigate" | "indent";
}>();

const emit = defineEmits<{
  "update:text": [value: string];
  "new-line": [];
  "delete-line": [];
  "move-up": [];
  "move-down": [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const unitMenuOpen = ref(false);
const activeUnitIndex = ref(0);

// 计算结果（V4：由父组件传入，支持变量引用）
const lineResult = computed<LineResult>(() => props.result ?? { result: null, text: "" });

// 语法高亮 tokens（响应式）
const tokens = computed(() => tokenize(props.text));

// 是否有可切换的单位
const hasUnitSwitcher = computed(() => !!lineResult.value.unitInfo);

// 当前展示的结果文本（可能是默认的，也可能是用户切换单位后的）
const displayText = computed(() => {
  const r = lineResult.value;
  if (!r.unitInfo) return r.text;
  // 如果用户没有手动切换，用默认的 text
  if (!unitMenuOpen.value && activeUnitIndex.value === r.unitInfo.defaultUnitIndex) {
    return r.text;
  }
  // 用 activeUnitIndex 对应的单位计算
  const unit = r.unitInfo.units[activeUnitIndex.value];
  const value = unit.fromBase
    ? unit.fromBase(r.unitInfo.baseValue)
    : r.unitInfo.baseValue / unit.factor;
  return `${formatNumber(value)} ${unit.label}`;
});

// 初始化 activeUnitIndex
function initActiveUnit() {
  if (lineResult.value.unitInfo) {
    activeUnitIndex.value = lineResult.value.unitInfo.defaultUnitIndex;
  }
}

// 切换单位
function switchUnit(index: number) {
  activeUnitIndex.value = index;
  unitMenuOpen.value = false;
}

// 计算某个单位的展示值
function calcUnitValue(baseValue: number, unit: { factor: number; fromBase?: (v: number) => number }) {
  const value = unit.fromBase ? unit.fromBase(baseValue) : baseValue / unit.factor;
  return formatNumber(value);
}

// 键盘交互
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    emit("new-line");
  } else if (e.key === "Backspace") {
    // 空行按 Backspace 删除当前行，聚焦上一行
    if (props.text === "") {
      e.preventDefault();
      emit("delete-line");
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    emit("move-up");
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    emit("move-down");
  } else if (e.key === "Tab") {
    if (props.tabBehavior === "indent") {
      // 缩进模式：在光标位置插入两个空格
      e.preventDefault();
      const input = e.target as HTMLInputElement;
      const start = input.selectionStart ?? props.text.length;
      const end = input.selectionEnd ?? props.text.length;
      const newText = props.text.slice(0, start) + "  " + props.text.slice(end);
      emit("update:text", newText);
      // 移动光标到插入位置之后
      nextTick(() => {
        input.selectionStart = input.selectionEnd = start + 2;
      });
    } else {
      // 导航模式：行间跳转
      e.preventDefault();
      if (e.shiftKey) {
        emit("move-up");
      } else {
        emit("move-down");
      }
    }
  }
}

// 聚焦输入框
function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<template>
  <div class="line-row">
    <!-- 行号 -->
    <span class="line-number">{{ index + 1 }}</span>

    <!-- 输入区 + 高亮叠加 -->
    <div class="input-wrap">
      <!-- 高亮叠加层：渲染带颜色的 tokens -->
      <div class="highlight-layer" aria-hidden="true">
        <span
          v-for="(tok, i) in tokens"
          :key="i"
          :class="tok.cls"
        >{{ tok.text }}</span>
        <!-- 末尾占位，防止空行高度塌陷 -->
        <span v-if="tokens.length === 0">&nbsp;</span>
      </div>
      <!-- 真正的 input：透明文字，承载光标和编辑 -->
      <input
        ref="inputRef"
        class="line-input"
        :value="text"
        @input="emit('update:text', ($event.target as HTMLInputElement).value)"
        @keydown="onKeydown"
        spellcheck="false"
        autocomplete="off"
      />
    </div>

    <!-- 结果区 -->
    <span
      class="line-result"
      :class="{ dim: lineResult.result === null, error: lineResult.error, 'has-unit': hasUnitSwitcher }"
      :title="lineResult.error"
    >
      <template v-if="lineResult.error">
        ⚠
      </template>
      <template v-else-if="hasUnitSwitcher">
        <span class="unit-display" @mouseenter="initActiveUnit(); unitMenuOpen = true" @mouseleave="unitMenuOpen = false">
          {{ displayText }}
          <span class="unit-arrow">▾</span>
          <!-- 单位切换菜单 -->
          <div v-if="unitMenuOpen" class="unit-menu" @mouseenter="unitMenuOpen = true">
            <div
              v-for="(unit, i) in lineResult.unitInfo!.units"
              :key="i"
              class="unit-option"
              :class="{ active: i === activeUnitIndex }"
              @click.stop="switchUnit(i)"
            >
              {{ calcUnitValue(lineResult.unitInfo!.baseValue, unit) }} {{ unit.label }}
            </div>
          </div>
        </span>
      </template>
      <template v-else>
        {{ lineResult.text || "—" }}
      </template>
    </span>
  </div>
</template>

<style scoped>
.line-row {
  display: grid;
  grid-template-columns: 40px 1fr 160px;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  transition: background-color 0.1s;
}

.line-row:hover {
  background-color: var(--bg-row-hover);
}

.line-number {
  color: var(--text-muted);
  font-size: 12px;
  text-align: right;
  padding-right: 12px;
  user-select: none;
}

.input-wrap {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

/* 高亮叠加层：和 input 完全重合，只渲染颜色文字 */
.highlight-layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  font-family: inherit;
  font-size: var(--app-font-size);
  line-height: 32px;
  white-space: pre;
  overflow: hidden;
  pointer-events: none;
  color: var(--text-muted); /* 非高亮文字（纯文字备注）灰色 */
}

.line-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  /* 输入文字透明，用户只看到高亮层的颜色 */
  color: transparent;
  caret-color: var(--caret);
  font-family: inherit;
  font-size: var(--app-font-size);
  padding: 0;
  user-select: text;
  position: relative;
  z-index: 1;
}

.line-input::placeholder {
  color: var(--text-dim);
}

.line-result {
  text-align: right;
  color: var(--text-result);
  font-size: var(--app-font-size);
  font-variant-numeric: tabular-nums;
  padding-left: 16px;
  border-left: 1px solid var(--border-row);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.line-result.dim {
  color: var(--text-dim);
}

.line-result.error {
  color: #ef4444;
  cursor: help;
}

/* ===== 单位切换器 ===== */
.line-result.has-unit {
  cursor: default;
}

.unit-display {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  position: relative;
  padding: 2px 6px;
  margin: -2px -6px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.unit-display:hover {
  background-color: var(--bg-row-hover);
}

.unit-arrow {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 1px;
}

.unit-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--bg-titlebar);
  border: 1px solid var(--border-titlebar);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 4px 0;
  z-index: 100;
  min-width: 120px;
  white-space: nowrap;
}

.unit-option {
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-muted);
  transition: background-color 0.1s;
}

.unit-option:hover {
  background-color: var(--bg-row-hover);
  color: var(--text-primary);
}

.unit-option.active {
  color: var(--accent);
  font-weight: 500;
}
</style>
