<script setup lang="ts">
import { ref, computed } from "vue";
import { calculateLine } from "../composables/useCalculator";

const props = defineProps<{
  index: number;
  text: string;
}>();

const emit = defineEmits<{
  "update:text": [value: string];
  "new-line": [];
  "delete-line": [];
  "move-up": [];
  "move-down": [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

// 计算结果（响应式，text 变化时自动重算）
const lineResult = computed(() => calculateLine(props.text));

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
    <span class="line-result" :class="{ dim: lineResult.result === null }">
      {{ lineResult.text || "—" }}
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
  background-color: #222;
}

.line-number {
  color: #555;
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

.line-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #e0e0e0;
  font-family: inherit;
  font-size: 15px;
  padding: 0;
  user-select: text;
}

.line-input::placeholder {
  color: #444;
}

.line-result {
  text-align: right;
  color: #fff;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  padding-left: 16px;
  border-left: 1px solid #333;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.line-result.dim {
  color: #444;
}
</style>
