import { ref } from "vue";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { APP_VERSION } from "./useVersion";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "installing"
  | "ready"
  | "error";

export interface UpdateInfo {
  version: string;
  date?: string;
  body?: string;
}

export function useUpdater() {
  const status = ref<UpdateStatus>("idle");
  const updateInfo = ref<UpdateInfo | null>(null);
  const progress = ref<number>(0);
  const errorMsg = ref<string>("");

  async function checkForUpdate(silent = false): Promise<void> {
    if (status.value === "checking" || status.value === "downloading" || status.value === "installing") return;

    status.value = "checking";
    errorMsg.value = "";
    progress.value = 0;

    try {
      const update = await check();

      if (update?.available) {
        // 版本比较：避免同一版本反复提示
        const latest = update.version;
        if (latest === APP_VERSION) {
          status.value = "not-available";
          if (!silent) {
            // 同版本不提示
          }
          return;
        }

        status.value = "available";
        updateInfo.value = {
          version: latest,
          date: update.date,
          body: update.body,
        };
      } else {
        status.value = "not-available";
      }
    } catch (e) {
      status.value = "error";
      errorMsg.value = String(e);
      if (silent) {
        // 静默模式下不显示错误，恢复 idle
        setTimeout(() => {
          status.value = "idle";
        }, 3000);
      }
    }
  }

  async function downloadAndInstall(): Promise<void> {
    if (status.value !== "available") return;

    status.value = "downloading";
    progress.value = 0;

    try {
      // 重新 check 获取 update 对象
      const update = await check();
      if (!update?.available) {
        status.value = "error";
        errorMsg.value = "更新不可用，请稍后重试";
        return;
      }

      status.value = "downloading";

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              progress.value = Math.round((downloaded / contentLength) * 100);
            }
            break;
          case "Finished":
            progress.value = 100;
            status.value = "ready";
            break;
        }
      });

      status.value = "ready";

      // 下载安装完成后提示重启
      // 调用方决定是否重启
    } catch (e) {
      status.value = "error";
      errorMsg.value = String(e);
    }
  }

  async function restartApp(): Promise<void> {
    await relaunch();
  }

  function reset(): void {
    status.value = "idle";
    updateInfo.value = null;
    progress.value = 0;
    errorMsg.value = "";
  }

  return {
    status,
    updateInfo,
    progress,
    errorMsg,
    checkForUpdate,
    downloadAndInstall,
    restartApp,
    reset,
  };
}
