<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { openUrl } from "@tauri-apps/plugin-opener";

const props = defineProps<{
  visible: boolean;
  mode: "prompt" | "confirm" | "about";
  title?: string;
  message?: string;
  defaultValue?: string;
  version?: string;
  author?: string;
  email?: string;
  repo?: string;
  // 更新相关
  latestVersion?: string;
  updateStatus?: string;
  updateProgress?: number;
  updateErrorMsg?: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [value: string];
  checkUpdate: [];
  downloadUpdate: [];
  restartApp: [];
}>();

const inputValue = ref("");

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      inputValue.value = props.defaultValue ?? "";
      await nextTick();
      // focus input for prompt mode
      const input = document.querySelector(".modal-input") as HTMLInputElement;
      input?.focus();
      input?.select();
    }
  }
);

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    if (props.mode === "confirm" || props.mode === "about") {
      emit("close");
    } else {
      doConfirm();
    }
  } else if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
  }
}

function doConfirm() {
  if (props.mode === "prompt" && inputValue.value.trim() !== "") {
    emit("confirm", inputValue.value.trim());
  }
  emit("close");
}

async function openLink(url: string) {
  try {
    await openUrl(url);
  } catch {
    // 静默失败，不影响弹窗
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="emit('close')" @keydown="onKeydown">
      <div class="modal-box" role="dialog" :aria-label="title">
        <!-- Prompt mode -->
        <template v-if="mode === 'prompt'">
          <div class="modal-title">{{ title }}</div>
          <input
            class="modal-input"
            v-model="inputValue"
            @keydown="onKeydown"
            :placeholder="message"
          />
          <div class="modal-actions">
            <button class="modal-btn modal-btn-cancel" @click="emit('close')">取消</button>
            <button class="modal-btn modal-btn-ok" @click="doConfirm">确定</button>
          </div>
        </template>

        <!-- Confirm mode -->
        <template v-else-if="mode === 'confirm'">
          <div class="modal-title">{{ title }}</div>
          <div class="modal-message">{{ message }}</div>
          <div class="modal-actions">
            <button class="modal-btn modal-btn-cancel" @click="emit('close')">取消</button>
            <button class="modal-btn modal-btn-danger" @click="emit('confirm', ''); emit('close')">删除</button>
          </div>
        </template>

        <!-- About mode -->
        <template v-else-if="mode === 'about'">
          <div class="modal-about">
            <img class="about-icon" src="/app-icon.png" alt="NoteCalc" />
            <div class="about-name">NoteCalc</div>
            <div class="about-version">v{{ version }}</div>
            <div class="about-divider"></div>
            <div class="about-row">
              <span class="about-label">当前版本</span>
              <span class="about-value">v{{ version }}</span>
            </div>
            <div class="about-row">
              <span class="about-label">最新版本</span>
              <span v-if="updateStatus === 'checking'" class="about-value about-dim">检查中…</span>
              <span v-else-if="updateStatus === 'error'" class="about-value about-dim">检查失败</span>
              <span v-else-if="latestVersion" class="about-value" :class="{ 'about-new': latestVersion !== version }">
                v{{ latestVersion }}
              </span>
              <span v-else class="about-value about-dim">—</span>
            </div>
            <div class="about-row"><span class="about-label">开发者</span><span class="about-value">{{ author }}</span></div>
            <div class="about-row"><span class="about-label">邮箱</span><a class="about-link" href="#" @click.prevent="openLink('mailto:' + (email ?? ''))">{{ email }}</a></div>
            <div class="about-row"><span class="about-label">项目</span><a class="about-link" href="#" @click.prevent="openLink(repo ?? '')">GitHub</a></div>

            <!-- 下载进度条 -->
            <div v-if="updateStatus === 'downloading'" class="about-progress">
              <div class="about-progress-bar">
                <div class="about-progress-fill" :style="{ width: (updateProgress ?? 0) + '%' }"></div>
              </div>
              <div class="about-progress-text">{{ updateProgress ?? 0 }}%</div>
            </div>

            <div class="about-divider"></div>
            <div class="about-footer">记事本风格的跨平台计算器</div>
          </div>

          <div class="modal-actions about-actions">
            <!-- 有新版本：显示更新按钮 -->
            <button
              v-if="latestVersion && latestVersion !== version && updateStatus === 'available'"
              class="modal-btn modal-btn-ok"
              @click="emit('downloadUpdate')"
            >现在更新</button>

            <!-- 下载中 -->
            <button
              v-else-if="updateStatus === 'downloading'"
              class="modal-btn modal-btn-ok"
              disabled
            >下载中…</button>

            <!-- 安装中 -->
            <button
              v-else-if="updateStatus === 'installing'"
              class="modal-btn modal-btn-ok"
              disabled
            >安装中…</button>

            <!-- 下载安装完成 -->
            <button
              v-else-if="updateStatus === 'ready'"
              class="modal-btn modal-btn-ok"
              @click="emit('restartApp')"
            >立即重启</button>

            <button class="modal-btn modal-btn-cancel" @click="emit('close')">关闭</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
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

.modal-box {
  background: var(--bg-titlebar);
  border: 1px solid var(--border-titlebar);
  border-radius: 10px;
  padding: 20px 24px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.15s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.modal-message {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 18px;
  line-height: 1.5;
}

.modal-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  background: var(--bg-body);
  color: var(--text-primary);
  border: 1px solid var(--border-row);
  border-radius: 6px;
  outline: none;
  margin-bottom: 18px;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.modal-input:focus {
  border-color: var(--accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.about-actions {
  align-items: center;
}

.modal-btn {
  padding: 6px 16px;
  font-size: 12px;
  font-family: inherit;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.1s, opacity 0.1s;
  font-weight: 500;
}

.modal-btn-cancel {
  background: var(--bg-row-hover);
  color: var(--text-muted);
}

.modal-btn-cancel:hover {
  background: var(--border-row);
  color: var(--text-primary);
}

.modal-btn-ok {
  background: var(--accent);
  color: #000;
}

.modal-btn-ok:hover {
  opacity: 0.85;
}

.modal-btn-ok:disabled {
  opacity: 0.4;
  cursor: default;
}

.modal-btn-danger {
  background: #ef4444;
  color: #fff;
}

.modal-btn-danger:hover {
  opacity: 0.85;
}

/* About dialog */
.modal-about {
  text-align: center;
  margin-bottom: 16px;
}

.about-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 8px;
  border-radius: 12px;
  display: block;
}

.about-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.about-version {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.about-divider {
  height: 1px;
  background: var(--border-titlebar);
  margin: 14px 0;
}

.about-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
}

.about-label {
  color: var(--text-muted);
}

.about-value {
  color: var(--text-primary);
}

.about-dim {
  color: var(--text-dim);
}

.about-new {
  color: var(--accent);
  font-weight: 500;
}

.about-link {
  color: var(--accent);
  text-decoration: none;
}

.about-link:hover {
  text-decoration: underline;
}

.about-footer {
  font-size: 11px;
  color: var(--text-dim);
}

/* 下载进度条 */
.about-progress {
  margin-top: 10px;
  text-align: left;
}

.about-progress-bar {
  width: 100%;
  height: 5px;
  background: var(--bg-body);
  border-radius: 3px;
  overflow: hidden;
}

.about-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.2s ease-out;
}

.about-progress-text {
  font-size: 11px;
  color: var(--text-dim);
  text-align: center;
  margin-top: 4px;
}
</style>
