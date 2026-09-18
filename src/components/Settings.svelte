<!-- src/components/Settings.svelte -->
<script lang="ts">
  import { Download, Upload } from "@lucide/svelte";
  import { cardsStore } from "../store";
  import type { Card } from "../types";

  let { onclose } = $props<{
    onclose?: () => void;
  }>();

  const version =
    typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.12";

  let fileInput = $state<HTMLInputElement | null>(null);

  function backupCards() {
    const date = new Date().toISOString().split("T")[0];
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify($cardsStore));

    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `loyal_backup_${date}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  }

  function triggerRestore() {
    fileInput?.click();
  }

  function handleFile(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (evt.target?.result) {
          const parsed = JSON.parse(evt.target.result as string) as Card[];
          cardsStore.set(parsed);
          alert("Backup restored successfully!");
          onclose?.();
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(target.files[0]);

    target.value = "";
  }
</script>

<div id="settings" style="margin-top: 40px; padding-top: 20px;">
  <button class="btn secondary-btn" onclick={backupCards}>
    <Download size={18} />
    Backup to File
  </button>
  <button class="btn secondary-btn" onclick={triggerRestore}>
    <Upload size={18} />
    Restore from File
  </button>

  <input
    type="file"
    bind:this={fileInput}
    onchange={handleFile}
    style="display:none"
    accept=".json"
  />

  <div
    style="margin-top: 20px; color: var(--text-secondary); font-size: 0.8em;"
  >
    App Version: <span>v{version}</span>
  </div>
</div>
