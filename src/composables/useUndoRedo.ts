import { ref } from "vue";
import type { Worksheet } from "../types";

/**
 * V8 Undo/Redo 历史管理
 *
 * 设计：
 * - undoStack / redoStack 存储 sheets + activeSheetId 的深拷贝快照
 * - 结构操作（新增行、删除行、增删工作表等）立即 push
 * - 文本输入由调用方防抖后调用 pushHistory
 * - 恢复时直接替换 sheets 和 activeSheetId
 */

interface HistorySnapshot {
  sheets: Worksheet[];
  activeSheetId: string;
  /** 触发此快照时聚焦的行索引（用于恢复焦点） */
  focusIndex: number;
}

const MAX_STACK_SIZE = 100;

export function useUndoRedo() {
  const undoStack = ref<HistorySnapshot[]>([]);
  const redoStack = ref<HistorySnapshot[]>([]);

  const canUndo = ref(false);
  const canRedo = ref(false);

  function updateFlags() {
    canUndo.value = undoStack.value.length > 0;
    canRedo.value = redoStack.value.length > 0;
  }

  function deepClone(sheets: Worksheet[]): Worksheet[] {
    return sheets.map((s) => ({
      ...s,
      lines: s.lines.map((l) => ({ ...l })),
    }));
  }

  /**
   * pushHistory: 记录当前状态到 undoStack，清空 redoStack
   * 在执行任何修改操作之前调用（保存的是修改前的状态）
   */
  function pushHistory(sheets: Worksheet[], activeSheetId: string, focusIndex: number = 0) {
    const snapshot: HistorySnapshot = {
      sheets: deepClone(sheets),
      activeSheetId,
      focusIndex,
    };
    undoStack.value.push(snapshot);
    // 限制栈大小
    if (undoStack.value.length > MAX_STACK_SIZE) {
      undoStack.value.shift();
    }
    // 新操作后清空 redo
    redoStack.value = [];
    updateFlags();
  }

  /**
   * undo: 弹出 undoStack 顶部快照，当前状态推入 redoStack
   * 返回要恢复的快照，或 null 表示无法 undo
   */
  function undo(
    currentSheets: Worksheet[],
    currentActiveSheetId: string,
    currentFocusIndex: number,
  ): HistorySnapshot | null {
    if (undoStack.value.length === 0) return null;

    // 当前状态推入 redo
    const currentSnapshot: HistorySnapshot = {
      sheets: deepClone(currentSheets),
      activeSheetId: currentActiveSheetId,
      focusIndex: currentFocusIndex,
    };
    redoStack.value.push(currentSnapshot);

    // 弹出上一状态
    const prev = undoStack.value.pop()!;
    updateFlags();
    return prev;
  }

  /**
   * redo: 弹出 redoStack 顶部快照，当前状态推入 undoStack
   * 返回要恢复的快照，或 null 表示无法 redo
   */
  function redo(
    currentSheets: Worksheet[],
    currentActiveSheetId: string,
    currentFocusIndex: number,
  ): HistorySnapshot | null {
    if (redoStack.value.length === 0) return null;

    // 当前状态推入 undo
    const currentSnapshot: HistorySnapshot = {
      sheets: deepClone(currentSheets),
      activeSheetId: currentActiveSheetId,
      focusIndex: currentFocusIndex,
    };
    undoStack.value.push(currentSnapshot);

    // 弹出下一状态
    const next = redoStack.value.pop()!;
    updateFlags();
    return next;
  }

  /** 清空所有历史（初始化时调用） */
  function clearHistory() {
    undoStack.value = [];
    redoStack.value = [];
    updateFlags();
  }

  return {
    canUndo,
    canRedo,
    pushHistory,
    undo,
    redo,
    clearHistory,
  };
}
