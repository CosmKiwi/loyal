<script lang="ts">
    import { cardsStore } from "../store";
    import type { Card } from "../types";

    const version =
        typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.12";

    let fileInput: HTMLInputElement;

    function backupCards() {
        const date = new Date().toISOString().split("T")[0];
        // We can access the current store state directly by prefixing with $
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
        fileInput.click();
    }

    function handleFile(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                if (evt.target?.result) {
                    const parsed = JSON.parse(
                        evt.target.result as string,
                    ) as Card[];
                    // Updating the store automatically updates localStorage AND the DOM!
                    cardsStore.set(parsed);
                    alert("Backup restored successfully!");
                }
            } catch (err) {
                alert("Invalid backup file.");
            }
        };
        reader.readAsText(target.files[0]);

        // Reset the input so the user can select the exact same file again if needed
        target.value = "";
    }
</script>

<div id="settings" style="margin-top: 40px; padding-top: 20px;">
    <button class="btn secondary-btn" on:click={backupCards}
        >Backup to File</button
    >
    <button class="btn secondary-btn" on:click={triggerRestore}
        >Restore from File</button
    >

    <input
        type="file"
        bind:this={fileInput}
        on:change={handleFile}
        style="display:none"
        accept=".json"
    />

    <div style="margin-top: 20px; color: #888; font-size: 0.8em;">
        App Version: <span>v{version}</span>
    </div>
</div>
