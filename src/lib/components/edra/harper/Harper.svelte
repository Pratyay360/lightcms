<script lang="ts">
  import { onMount } from "svelte";
  import { getEditor } from "../tiptap/components/editorContext.js";
  import { primeHarper } from "./harper-client.ts";
  import HarperPopover from "./HarperPopover.svelte";

  const editor = getEditor();

  onMount(() => {
    primeHarper();
  });
</script>

<HarperPopover />