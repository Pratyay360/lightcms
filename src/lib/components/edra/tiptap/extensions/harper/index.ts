import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { lintText } from "../../../harper/harper-client.ts";
import type { HarperIssue } from "../../../harper/types.ts";

const HARPER_PLUGIN_KEY = new PluginKey("harper");

const DEBOUNCE_MS = 250;

const SKIPPED_NODE_TYPES = new Set([
  "codeBlock",
  "code_block",
  "image",
  "mermaid",
  "iframe",
  "video",
  "audio",
  "callout",
  "tableCell",
  "tableHeader",
  "tableRow",
  "mathInline",
  "mathBlock",
  "mathematics",
  "horizontalRule",
  "tableOfContents",
]);

interface IssueMeta {
  from: number;
  to: number;
  issue: HarperIssue;
}

const collectTextSegments = (doc: PMNode): Array<{ from: number; to: number; text: string }> => {
  const segments: Array<{ from: number; to: number; text: string }> = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    if (node.marks.some((mark) => mark.type.name === "code")) return false;
    segments.push({
      from: pos,
      to: pos + node.nodeSize,
      text: node.text ?? "",
    });
    return true;
  });
  return segments;
};

const buildPlainText = (segments: Array<{ from: number; to: number; text: string }>): string => {
  let cursor = 0;
  let result = "";
  for (const segment of segments) {
    const gap = segment.from - cursor;
    if (gap > 0) result += "\n".repeat(gap);
    result += segment.text;
    cursor = segment.to;
  }
  return result;
};

const remapIssuesToDoc = (
  segments: Array<{ from: number; to: number; text: string }>,
  issues: HarperIssue[],
): IssueMeta[] => {
  if (segments.length === 0) return [];
  const plainStarts: number[] = [];
  let plainOffset = 0;
  for (const segment of segments) {
    plainStarts.push(plainOffset);
    plainOffset += segment.text.length;
  }
  const totalPlain = plainOffset;
  const mapped: IssueMeta[] = [];
  for (const issue of issues) {
    if (issue.from < 0 || issue.to > totalPlain || issue.from === issue.to) continue;
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      const segStart = plainStarts[i] ?? 0;
      const segEnd = segStart + segment.text.length;
      const overlapFrom = Math.max(issue.from, segStart);
      const overlapTo = Math.min(issue.to, segEnd);
      if (overlapFrom >= overlapTo) continue;
      const docFrom = segment.from + (overlapFrom - segStart);
      const docTo = segment.from + (overlapTo - segStart);
      mapped.push({ from: docFrom, to: docTo, issue });
    }
  }
  return mapped;
};

const buildDecorations = (doc: PMNode, metas: IssueMeta[]): DecorationSet => {
  const decorations: Decoration[] = [];
  for (const meta of metas) {
    const payload = encodePayload(meta.issue);
    decorations.push(
      Decoration.inline(meta.from, meta.to, {
        class: "harper-issue",
        "data-harper-id": meta.issue.id,
        "data-harper-payload": payload,
      }),
    );
  }
  return DecorationSet.create(doc, decorations);
};

const encodePayload = (issue: HarperIssue): string => {
  const safe = {
    id: issue.id,
    message: issue.message,
    suggestions: issue.suggestions,
  };
  return encodeURIComponent(JSON.stringify(safe));
};

export const decodeHarperPayload = (raw: string | null): HarperIssue | null => {
  if (!raw) return null;
  try {
    const json = JSON.parse(decodeURIComponent(raw));
    if (!json || typeof json !== "object") return null;
    const message = typeof json.message === "string" ? json.message : "";
    const suggestions = Array.isArray(json.suggestions)
      ? json.suggestions.filter((value: unknown): value is string => typeof value === "string")
      : [];
    const id = typeof json.id === "string" ? json.id : "";
    if (!id) return null;
    return { id, from: 0, to: 0, message, suggestions };
  } catch {
    return null;
  }
};

export const Harper = Extension.create({
  name: "harper",

  addProseMirrorPlugins() {
    const editor = this.editor;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pending = false;

    const schedule = () => {
      pending = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void runLint();
      }, DEBOUNCE_MS);
    };

    const runLint = async () => {
      if (!pending) return;
      pending = false;
      try {
        const doc = editor.state.doc;
        const segments = collectTextSegments(doc).filter((segment) => {
          const $pos = doc.resolve(segment.from);
          for (let d = $pos.depth; d >= 0; d -= 1) {
            if (SKIPPED_NODE_TYPES.has($pos.node(d).type.name)) return false;
          }
          return true;
        });
        const plainText = buildPlainText(segments);
        const issues = await lintText(plainText);
        const metas = remapIssuesToDoc(segments, issues);
        const view = editor.view;
        if (!view || view.isDestroyed) return;
        view.dispatch(view.state.tr.setMeta(HARPER_PLUGIN_KEY, { metas }));
      } catch (error) {
        console.error("[harper] lint failed:", error);
      }
    };

    return [
      new Plugin({
        key: HARPER_PLUGIN_KEY,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, oldState, oldEditorState, newEditorState) {
            if (tr.docChanged) schedule();
            const meta = tr.getMeta(HARPER_PLUGIN_KEY) as { metas: IssueMeta[] } | undefined;
            if (meta) {
              return buildDecorations(newEditorState.doc, meta.metas);
            }
            return oldState.map(tr.mapping, newEditorState.doc);
          },
        },
        props: {
          decorations(state) {
            return HARPER_PLUGIN_KEY.getState(state) as DecorationSet;
          },
        },
      }),
    ];
  },
});

export type { HarperIssue };
