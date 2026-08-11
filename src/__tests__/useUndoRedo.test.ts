import { describe, it, expect } from "vitest";
import { useUndoRedo } from "../composables/useUndoRedo";
import type { Worksheet } from "../types";

function makeSheet(id: string, name: string, texts: string[]): Worksheet {
  return {
    id,
    name,
    lines: texts.map((t, i) => ({ id: i + 1, text: t })),
  };
}

describe("V8 - useUndoRedo", () => {
  it("初始状态 canUndo 和 canRedo 都为 false", () => {
    const { canUndo, canRedo } = useUndoRedo();
    expect(canUndo.value).toBe(false);
    expect(canRedo.value).toBe(false);
  });

  it("pushHistory 后 canUndo 为 true，canRedo 为 false", () => {
    const { canUndo, canRedo, pushHistory } = useUndoRedo();
    const sheet = makeSheet("s1", "工作表 1", ["1 + 2"]);
    pushHistory([sheet], "s1", 0);
    expect(canUndo.value).toBe(true);
    expect(canRedo.value).toBe(false);
  });

  it("undo 返回上一个快照，canRedo 变为 true", () => {
    const { pushHistory, undo, canUndo, canRedo } = useUndoRedo();
    const sheet1 = makeSheet("s1", "工作表 1", ["1 + 2"]);
    const sheet2 = makeSheet("s1", "工作表 1", ["1 + 2", "3 * 4"]);

    // 记录初始状态（pushHistory 保存修改前的状态）
    pushHistory([sheet1], "s1", 0);
    // 现在状态变为 sheet2，undo 应返回 sheet1
    const snapshot = undo([sheet2], "s1", 1);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.sheets[0].lines).toHaveLength(1);
    expect(snapshot!.sheets[0].lines[0].text).toBe("1 + 2");
    expect(canUndo.value).toBe(false); // undoStack 空了
    expect(canRedo.value).toBe(true);
  });

  it("redo 恢复被撤销的状态", () => {
    const { pushHistory, undo, redo } = useUndoRedo();
    const sheet1 = makeSheet("s1", "工作表 1", ["1 + 2"]);
    const sheet2 = makeSheet("s1", "工作表 1", ["1 + 2", "3 * 4"]);

    pushHistory([sheet1], "s1", 0);
    // undo → 回到 sheet1 状态
    const undone = undo([sheet2], "s1", 1);
    expect(undone!.sheets[0].lines).toHaveLength(1);

    // redo → 恢复 sheet2 状态
    const redone = redo([sheet1], "s1", 0);
    expect(redone).not.toBeNull();
    expect(redone!.sheets[0].lines).toHaveLength(2);
    expect(redone!.sheets[0].lines[1].text).toBe("3 * 4");
  });

  it("pushHistory 后清空 redoStack", () => {
    const { pushHistory, undo, canRedo } = useUndoRedo();
    const sheet1 = makeSheet("s1", "工作表 1", ["1 + 2"]);
    const sheet2 = makeSheet("s1", "工作表 1", ["1 + 2", "3 * 4"]);
    const sheet3 = makeSheet("s1", "工作表 1", ["1 + 2", "3 * 4", "5 + 6"]);

    pushHistory([sheet1], "s1", 0);
    pushHistory([sheet2], "s1", 1);

    // undo 后 canRedo = true
    undo([sheet2], "s1", 1);
    expect(canRedo.value).toBe(true);

    // 新操作 pushHistory，redoStack 应被清空
    pushHistory([sheet3], "s1", 2);
    expect(canRedo.value).toBe(false);
  });

  it("连续 undo 到栈空返回 null", () => {
    const { pushHistory, undo, canUndo } = useUndoRedo();
    const sheet1 = makeSheet("s1", "工作表 1", ["1 + 2"]);
    const sheet2 = makeSheet("s1", "工作表 1", ["1 + 2", "3 * 4"]);

    pushHistory([sheet1], "s1", 0);
    pushHistory([sheet2], "s1", 1);

    // undo 2 次
    undo([sheet2], "s1", 1);
    const second = undo([sheet1], "s1", 0);
    expect(second).not.toBeNull(); // 还有1个在栈里

    // 第3次 undo 应返回 null
    const third = undo([sheet1], "s1", 0);
    expect(third).toBeNull();
    expect(canUndo.value).toBe(false);
  });

  it("focusIndex 被正确保存和恢复", () => {
    const { pushHistory, undo } = useUndoRedo();
    const sheet = makeSheet("s1", "工作表 1", ["1", "2", "3"]);

    // pushHistory 保存 focusIndex=2，修改后 focusIndex 变为 5
    pushHistory([sheet], "s1", 2);
    const snapshot = undo([sheet], "s1", 5);
    expect(snapshot!.focusIndex).toBe(2);
  });

  it("深拷贝：pushHistory 后修改原数据不影响快照", () => {
    const { pushHistory, undo } = useUndoRedo();
    const sheet = makeSheet("s1", "工作表 1", ["1 + 2"]);

    pushHistory([sheet], "s1", 0);
    // 修改原数据
    sheet.lines[0].text = "changed";

    const snapshot = undo([sheet], "s1", 0);
    // undo 返回的快照应该是修改前的数据
    expect(snapshot!.sheets[0].lines[0].text).toBe("1 + 2");
  });

  it("activeSheetId 被正确保存和恢复", () => {
    const { pushHistory, undo } = useUndoRedo();
    const sheet1 = makeSheet("s1", "工作表 1", ["1"]);
    const sheet2 = makeSheet("s2", "工作表 2", ["2"]);

    // pushHistory 保存 activeSheetId=s1，修改后变为 s2
    pushHistory([sheet1, sheet2], "s1", 0);
    const snapshot = undo([sheet1, sheet2], "s2", 0);
    expect(snapshot!.activeSheetId).toBe("s1");
  });

  it("clearHistory 清空两个栈", () => {
    const { pushHistory, undo, clearHistory, canUndo, canRedo } = useUndoRedo();
    const sheet = makeSheet("s1", "工作表 1", ["1"]);

    pushHistory([sheet], "s1", 0);
    undo([sheet], "s1", 0);
    expect(canUndo.value || canRedo.value).toBe(true);

    clearHistory();
    expect(canUndo.value).toBe(false);
    expect(canRedo.value).toBe(false);
  });

  it("栈大小限制：超过 MAX_STACK_SIZE 后丢弃最旧的", () => {
    const { pushHistory, undo, canUndo } = useUndoRedo();
    const sheet = makeSheet("s1", "工作表 1", ["1"]);

    // push 105 次
    for (let i = 0; i < 105; i++) {
      pushHistory([sheet], "s1", i);
    }

    // undo 100 次应该都能成功，第101次返回 null
    let count = 0;
    let result = undo([sheet], "s1", 104);
    while (result !== null) {
      count++;
      result = undo(result.sheets, result.activeSheetId, result.focusIndex);
    }
    expect(count).toBe(100);
    expect(canUndo.value).toBe(false);
  });
});
