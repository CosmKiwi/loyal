<!-- src/components/Settings.svelte -->
<script lang="ts">
  import { Download, Upload, X } from "@lucide/svelte";
  import { cardsStore } from "../store";
  import type { Card } from "../types";

  let { onclose } = $props<{
    onclose: () => void;
  }>();

  const version =
    typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.2.2";

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
          onclose();
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(target.files[0]);
    target.value = "";
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="sheet-backdrop"
  onclick={(e) => e.target === e.currentTarget && onclose()}
>
  <div class="sheet-panel">
    <div class="sheet-header">
      <h3>Settings</h3>
      <button class="close-btn" onclick={onclose} aria-label="Close">
        <X size={20} />
      </button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button class="btn btn-outline" onclick={backupCards}>
        <Download size={18} />
        Backup to File
      </button>

      <button class="btn btn-outline" onclick={() => fileInput?.click()}>
        <Upload size={18} />
        Restore from File
      </button>
    </div>

    <input
      type="file"
      bind:this={fileInput}
      onchange={handleFile}
      style="display:none"
      accept=".json"
    />

    <p
      style="text-align: center; margin-top: 24px; color: var(--text-secondary); font-size: 0.85em;"
    >
      App Version: <strong>v{version}</strong>
    </p>
  </div>
</div>
