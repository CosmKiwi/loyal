<!-- src/components/Settings.svelte -->
<script lang="ts">
  import { Download, Upload, Globe, Moon } from "@lucide/svelte";
  import BottomSheet from "./BottomSheet.svelte";
  import { cardStore, regionStore, themeStore, migrateCards } from "../store";
  import { REGIONS } from "../presets";

  let { onclose } = $props<{
    onclose: () => void;
  }>();

  const version = __APP_VERSION__;

  let fileInput = $state<HTMLInputElement | null>(null);

  function backupCards() {
    const date = new Date().toISOString().split("T")[0];
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(cardStore.items));

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
          const parsed = JSON.parse(evt.target.result as string);
          const upgraded = migrateCards(parsed);
          cardStore.replace(upgraded);
          alert("Backup restored and upgraded successfully!");
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

<BottomSheet title="Settings" {onclose}>
  <div class="setting-group">
    <label for="themeSelect" class="setting-label">
      <Moon size={15} />
      <span>Theme Preference</span>
    </label>
    <select id="themeSelect" class="setting-select" bind:value={themeStore.current}>
      <option value="system">System Default</option>
      <option value="light">Light Mode</option>
      <option value="dark">Dark Mode</option>
    </select>
  </div>

  <div class="setting-group">
    <label for="regionSelect" class="setting-label">
      <Globe size={15} />
      <span>Brand Catalog Region</span>
    </label>
    <select
      id="regionSelect"
      class="setting-select"
      bind:value={regionStore.current}
    >
      {#each Object.values(REGIONS) as region}
        <option value={region.regionCode}>
          {region.regionName} ({region.regionCode})
        </option>
      {/each}
    </select>
  </div>

  <div class="actions-group">
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

  <p class="version-tag">
    App Version: <strong>v{version}</strong>
  </p>
</BottomSheet>

<style>
  .setting-group {
    margin-bottom: 20px;
    text-align: left;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }

  .setting-select {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-body);
    color: var(--text-primary);
    font-size: 0.95rem;
    font-weight: 500;
    outline: none;
    transition: border-color 0.15s ease;
    appearance: auto;
  }

  .setting-select:focus {
    border-color: var(--primary);
  }

  .actions-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .version-tag {
    text-align: center;
    margin-top: 24px;
    color: var(--text-secondary);
    font-size: 0.85em;
  }
</style>
