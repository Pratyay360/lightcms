<script lang="ts">
import EditorWorkspace from "$lib/components/cms/EditorWorkspace.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();

function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () =>
			reject(reader.error ?? new Error("Could not read file."));
		reader.readAsDataURL(file);
	});
}
</script>

<svelte:head>
  <title>Live editor demo | LightCMS</title>
  <meta
    name="description"
    content="Try the LightCMS editor with a sample post."
  />
</svelte:head>

<EditorWorkspace
  file={data.file}
  repository={data.repository}
  branch={data.branch}
  backUrl="/"
  backTitle="Back to home"
  saveUrl="?/save"
  reloadOnSave={false}
  savedMessage="Not Saved (demo only)"
  onFileUpload={readFileAsDataUrl}
/>
