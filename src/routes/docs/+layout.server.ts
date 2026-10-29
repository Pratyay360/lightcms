import { groupDocsBySection, loadDocEntries } from "$lib/server/docs";
import type { LayoutServerLoad } from "./$types";

export const prerender = true;

export const load: LayoutServerLoad = async () => {
  const entries = await loadDocEntries();
  const sections = groupDocsBySection(entries);

  return {
    sections,
  };
};
