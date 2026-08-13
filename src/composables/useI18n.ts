import { computed, ref } from "vue";
import type { Language } from "../types";

type Dict = Record<string, { zh: string; en: string }>;

const currentLang = ref<Language>("zh");

/** 翻译字典 */
const dict: Dict = {
  // ===== 标题栏 =====
  undo: { zh: "撤销", en: "Undo" },
  redo: { zh: "重做", en: "Redo" },
  export: { zh: "导出", en: "Export" },
  import: { zh: "导入", en: "Import" },
  toggleTheme: { zh: "切换主题", en: "Toggle theme" },
  about: { zh: "关于", en: "About" },
  settings: { zh: "设置", en: "Settings" },

  // ===== 侧边栏 =====
  sheets: { zh: "工作表", en: "Sheets" },
  addSheet: { zh: "新增工作表", en: "Add worksheet" },
  renameSheet: { zh: "重命名工作表", en: "Rename worksheet" },
  enterNewName: { zh: "请输入新名称", en: "Enter new name" },
  deleteSheet: { zh: "删除工作表", en: "Delete worksheet" },
  confirmDeleteSheet: { zh: "确定删除工作表", en: "Delete worksheet" },
  delete: { zh: "删除", en: "Delete" },
  doubleClickHint: { zh: "双击重命名", en: "Double-click to rename" },
  worksheet: { zh: "工作表", en: "Worksheet" },

  // ===== 汇总栏 =====
  items: { zh: "项", en: "items" },
  noCalculations: { zh: "无计算", en: "No calculations" },
  total: { zh: "总计", en: "Total" },

  // ===== 弹窗按钮 =====
  cancel: { zh: "取消", en: "Cancel" },
  ok: { zh: "确定", en: "OK" },
  close: { zh: "关闭", en: "Close" },

  // ===== 关于对话框 =====
  currentVersion: { zh: "当前版本", en: "Current version" },
  latestVersion: { zh: "最新版本", en: "Latest version" },
  checking: { zh: "检查中…", en: "Checking…" },
  checkFailed: { zh: "检查失败", en: "Check failed" },
  developer: { zh: "开发者", en: "Developer" },
  email: { zh: "邮箱", en: "Email" },
  project: { zh: "项目", en: "Project" },
  updateNow: { zh: "现在更新", en: "Update now" },
  downloading: { zh: "下载中…", en: "Downloading…" },
  installing: { zh: "安装中…", en: "Installing…" },
  restartNow: { zh: "立即重启", en: "Restart now" },
  appDescription: { zh: "记事本风格的跨平台计算器", en: "Notepad-style cross-platform calculator" },

  // ===== 设置对话框 =====
  settingsTitle: { zh: "设置", en: "Settings" },
  appearance: { zh: "外观", en: "Appearance" },
  behavior: { zh: "行为", en: "Behavior" },
  data: { zh: "数据", en: "Data" },
  font: { zh: "字体", en: "Font" },
  fontSize: { zh: "字号", en: "Font size" },
  theme: { zh: "主题", en: "Theme" },
  themeDark: { zh: "暗色", en: "Dark" },
  themeLight: { zh: "浅色", en: "Light" },
  themeSystem: { zh: "跟随系统", en: "System" },
  language: { zh: "界面语言", en: "Language" },
  langZh: { zh: "中文", en: "Chinese" },
  langEn: { zh: "English", en: "English" },
  decimalPlaces: { zh: "小数位数", en: "Decimal places" },
  thousandsSeparator: { zh: "千分位分隔符", en: "Thousands separator" },
  tabBehavior: { zh: "Tab 键行为", en: "Tab key behavior" },
  tabNavigate: { zh: "行间跳转", en: "Navigate between lines" },
  tabIndent: { zh: "缩进", en: "Indent" },
  dataDir: { zh: "保存目录", en: "Save directory" },
  dataDirDefault: { zh: "默认", en: "Default" },
  dataDirCustom: { zh: "自定义", en: "Custom" },
  browse: { zh: "浏览…", en: "Browse…" },
  exportEncoding: { zh: "导出编码", en: "Export encoding" },
  defaultExportFormat: { zh: "默认导出格式", en: "Default export format" },
  on: { zh: "开", en: "On" },
  off: { zh: "关", en: "Off" },
  px: { zh: "px", en: "px" },
};

/** 设置当前语言 */
export function setLanguage(lang: Language) {
  currentLang.value = lang;
}

/** 获取当前语言 */
export function getLanguage(): Language {
  return currentLang.value;
}

/** 翻译函数 t(key) */
export function t(key: string): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[currentLang.value] ?? entry.zh;
}

/** 响应式翻译函数（用于模板） */
export function useI18n() {
  return {
    t: (key: string) => {
      const entry = dict[key];
      if (!entry) return key;
      return entry[currentLang.value] ?? entry.zh;
    },
    lang: computed(() => currentLang.value),
  };
}
