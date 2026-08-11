<script setup lang="ts">
import type { Worksheet } from "../types";

defineProps<{
  sheets: Worksheet[];
  activeSheetId: string;
}>();

const emit = defineEmits<{
  "select-sheet": [id: string];
  "add-sheet": [];
  "rename-sheet": [id: string, name: string];
  "delete-sheet": [id: string];
}>();

function onAdd() {
  emit("add-sheet");
}

function onSelect(id: string) {
  emit("select-sheet", id);
}

function onRename(id: string, currentName: string) {
  const newName = prompt("工作表名称", currentName);
  if (newName !== null && newName.trim() !== "") {
    emit("rename-sheet", id, newName.trim());
  }
}

function onDelete(id: string, name: string) {
  if (confirm(`删除工作表"${name}"？`)) {
    emit("delete-sheet", id);
  }
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">工作表</span>
      <button class="btn-add" @click="onAdd" title="新增工作表">+</button>
    </div>
    <ul class="sheet-list">
      <li
        v-for="sheet in sheets"
        :key="sheet.id"
        :class="['sheet-item', { active: sheet.id === activeSheetId }]"
        @click="onSelect(sheet.id)"
        @dblclick="onRename(sheet.id, sheet.name)"
      >
        <span class="sheet-name">{{ sheet.name }}</span>
        <button
          class="btn-delete"
          @click.stop="onDelete(sheet.id, sheet.name)"
          title="删除"
        >×</button>
      </li>
    </ul>
    <div class="sidebar-footer">
      <span class="hint">双击重命名</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-titlebar);
  border-right: 1px solid var(--border-titlebar);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-titlebar);
}

.sidebar-title {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.btn-add {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 6px;
  border-radius: 4px;
  line-height: 1;
}

.btn-add:hover {
  background-color: var(--bg-row-hover);
  color: var(--text-primary);
}

.sheet-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  overflow-y: auto;
  flex: 1;
}

.sheet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background-color 0.1s;
}

.sheet-item:hover {
  background-color: var(--bg-row-hover);
}

.sheet-item.active {
  background-color: var(--bg-row-hover);
  border-left: 2px solid var(--accent);
}

.sheet-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-delete {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-dim);
  padding: 0 4px;
  border-radius: 4px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.1s;
}

.sheet-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  color: #ef4444;
}

.sidebar-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--border-titlebar);
}

.hint {
  font-size: 10px;
  color: var(--text-dim);
}
</style>
