import { Extension } from "@tiptap/core";
import { BLOCK_TRIGGERS, INLINE_PAIRS } from "./catalog.js";
import { createAutocompletePlugin } from "./plugin.js";
import type { AutocompleteOptions } from "./types.js";

export type { AutocompleteOptions } from "./types.js";
export { AutocompleteKey } from "./plugin.js";

export const InlineAutocomplete = Extension.create<AutocompleteOptions>({
  name: "inlineAutocomplete",

  addOptions() {
    return {
      blockTriggers: BLOCK_TRIGGERS,
      inlinePairs: INLINE_PAIRS,
      emoji: true,
    };
  },

  addProseMirrorPlugins() {
    return [createAutocompletePlugin(this.editor, this.options)];
  },
});

export default InlineAutocomplete;
