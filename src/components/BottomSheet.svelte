<!-- src/components/BottomSheet.svelte -->
<script lang="ts">
  import { X } from "@lucide/svelte";
  import type { Snippet } from "svelte";

  let {
    title,
    onclose,
    children,
  } = $props<{
    title: string;
    onclose: () => void;
    children?: Snippet;
  }>();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="sheet-backdrop"
  onclick={(e) => e.target === e.currentTarget && onclose()}
>
  <div class="sheet-panel" role="dialog" aria-modal="true" aria-label={title}>
    <div class="sheet-header">
      <h3>{title}</h3>
      <button class="close-btn" onclick={onclose} aria-label="Close">
        <X size={20} />
      </button>
    </div>

    {@render children?.()}
  </div>
</div>
