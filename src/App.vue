<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";
import LineRow from "./components/LineRow.vue";
import SummaryBar from "./components/SummaryBar.vue";
import { calculateLine } from "./composables/useCalculator";
import type { Line } from "./types";

let nextId = 1;

// 行数据
const lines = ref<Line[]>([
  { id: nextId++, text: "" },
]);

// 行 ref 引用
const lineRefs = ref<Array<InstanceType<typeof LineRow> | null>>([]);

// 计算汇总
const summary = computed(() => {
  let total = 0;
  let count = 0;
  for (const line of lines.value) {
    const { result } = calculateLine(line.text);
    if (result !== null) {
      total += result;
      count++;
    }
  }
  return { total: count > 0 ? total : null, count };
});

// 更新行文本
function updateText(index: number, value: string) {
  lines.value[index].text = value;
}

// 新增行
async function newLine(index: number) {
  const item: Line = { id: nextId++, text: "" };
  lines.value.splice(index + 1, 0, item);
  await nextTick();
  lineRefs.value[index + 1]?.focus();
}

// 删除行
async function deleteLine(index: number) {
  if (lines.value.length <= 1) return;

  lines.value.splice(index, 1);
  const target = Math.max(0, index - 1);
  await nextTick();
  lineRefs.value[target]?.focus();
}

// 上下移动焦点
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
    // 最后一行按 Down 也新建一行
    await newLine(index);
  }
}

// 初始化：聚焦第一行
onMounted(() => {
  lineRefs.value[0]?.focus();
});
</script>

<template>
  <div class="app">
    <!-- 标题栏 -->
    <header class="title-bar" data-tauri-drag-region>
      <span class="title-text">notecalc</span>
    </header>

    <!-- 工作区 -->
    <main class="worksheet">
      <LineRow
        v-for="(line, index) in lines"
        :key="line.id"
        :ref="(el) => (lineRefs[index] = el as InstanceType<typeof LineRow> | null)"
        :index="index"
        :text="line.text"
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
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.title-bar {
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background-color: #111;
  border-bottom: 1px solid #2a2a2a;
  -webkit-app-region: drag;
}

.title-text {
  font-size: 13px;
  color: #666;
  letter-spacing: 1px;
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
