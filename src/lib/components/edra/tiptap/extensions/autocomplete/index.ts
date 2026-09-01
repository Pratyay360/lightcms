import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type Suggestion = {
  match: RegExp;
  ghost: (m: RegExpMatchArray) => string;
  apply: (editor: any, m: RegExpMatchArray, range: { from: number; to: number }) => void;
  label: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    label: "Heading 1",
    match: /^#$/,
    ghost: () => " Heading 1",
    apply: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    label: "Heading 2",
    match: /^##$/,
    ghost: () => " Heading 2",
    apply: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    label: "Heading 3",
    match: /^###$/,
    ghost: () => " Heading 3",
    apply: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    label: "Bullet list",
    match: /^-$/,
    ghost: () => " Bullet list",
    apply: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Ordered list",
    match: /^1\.$/,
    ghost: () => " Ordered list",
    apply: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Blockquote",
    match: /^>$/,
    ghost: () => " Blockquote",
    apply: (editor) => editor.chain().focus().setBlockquote().run(),
  },
  {
    label: "Code block",
    match: /^```$/,
    ghost: () => " Code block",
    apply: (editor) => editor.chain().focus().setCodeBlock().run(),
  },
  {
    label: "Horizontal rule",
    match: /^---$/,
    ghost: () => " Horizontal rule — press Tab",
    apply: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

function getSuggestion(
  textBefore: string,
): { suggestion: Suggestion; match: RegExpMatchArray } | null {
  for (const s of SUGGESTIONS) {
    const m = textBefore.match(s.match);
    if (m) return { suggestion: s, match: m };
  }
  return null;
}

export const AutocompleteKey = new PluginKey("inline-autocomplete");

export const InlineAutocomplete = Extension.create({
  name: "inlineAutocomplete",

  addProseMirrorPlugins() {
    const editorRef: { editor: any } = { editor: null as any };
    // capture editor after view ready
    this.editor.on("create", () => (editorRef.editor = this.editor));

    return [
      new Plugin({
        key: AutocompleteKey,
        state: {
          init() {
            return {
              deco: DecorationSet.empty,
              active: null as null | {
                suggestion: Suggestion;
                match: RegExpMatchArray;
                pos: number;
              },
            };
          },
          apply(tr, prev, _oldState, newState) {
            if (!tr.docChanged && !tr.selectionSet) return prev;
            const sel = newState.selection;
            if (!sel.empty || sel.$from.parent.type.name === "codeBlock") {
              return { deco: DecorationSet.empty, active: null };
            }
            const parent = sel.$from.parent;
            const textBefore = parent.textBetween(0, sel.$from.parentOffset, undefined, "\ufffc");
            // only trigger at block start-ish patterns
            const trimmed = textBefore.trimStart();
            // inline formatting ghosts (e.g. **bold**)
            // For inline, detect partial syntax at end: **, *, `, [, etc.
            const inlineMap: Record<string, string> = {
              "**": "bold**",
              "*": "italic*",
              "`": "code`",
              "~~": "strike~~",
            };
            const tail = textBefore.slice(-2);
            let inlineGhost: string | null = null;
            if (inlineMap[tail]) inlineGhost = inlineMap[tail].slice(tail.length);
            else if (textBefore.endsWith("[")) inlineGhost = "](url)";

            const found = getSuggestion(trimmed);
            if (!found && !inlineGhost) return { deco: DecorationSet.empty, active: null };

            const pos = sel.$from.pos;
            const ghost = found ? found.suggestion.ghost(found.match) : inlineGhost!;
            const deco = Decoration.widget(pos, () => {
              const span = document.createElement("span");
              span.textContent = ghost;
              span.className =
                "inline-autocomplete-ghost pointer-events-none select-none opacity-40";
              span.setAttribute("aria-hidden", "true");
              return span;
            });
            return {
              deco: DecorationSet.create(newState.doc, [deco]),
              active: found ? { suggestion: found.suggestion, match: found.match, pos } : null,
            };
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.deco ?? DecorationSet.empty;
          },
          handleKeyDown(view, e) {
            if (e.key !== "Tab" && e.key !== "Enter") return false;
            if (e.key === "Enter" && !e.shiftKey) return false;
            const st = this.getState(view.state);
            if (!st?.active) {
              // Tab for inline auto-close?
              if (e.key === "Tab") {
                const sel = view.state.selection;
                const textBefore = sel.$from.parent.textBetween(
                  0,
                  sel.$from.parentOffset,
                  undefined,
                  "\ufffc",
                );
                if (
                  textBefore.endsWith("**") ||
                  textBefore.endsWith("~~") ||
                  textBefore.endsWith("[")
                )
                  return false;
              }
              return false;
            }
            e.preventDefault();
            const editor = editorRef.editor;
            if (!editor) return true;
            // delete trigger text then apply
            const { from } = view.state.selection;
            const triggerLen = st.active.match[0].length;
            const parentStart = from - view.state.selection.$from.parentOffset;
            // For block triggers, select trigger and replace via command
            editor.chain().focus().deleteRange({ from: parentStart, to: from }).run();
            st.active.suggestion.apply(editor, st.active.match, {
              from: parentStart,
              to: from,
            });
            return true;
          },
        },
      }),
    ];
  },
});

export default InlineAutocomplete;
