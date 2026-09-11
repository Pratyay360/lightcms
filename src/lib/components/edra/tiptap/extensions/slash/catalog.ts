import Lightbulb from "@lucide/svelte/icons/lightbulb";
import Minus from "@lucide/svelte/icons/minus";
import Quote from "@lucide/svelte/icons/quote";
import SquareCode from "@lucide/svelte/icons/square-code";
import { commands, type EdraCommand } from "../../../commands/index.js";
import type { Editor } from "../../../tiptap/index.js";

export interface SlashGroup {
  name: string;
  title: string;
  actions: EdraCommand[];
}

export const SLASH_EXTENSION_NAME = "slashCommand";

export const SLASH_GROUPS: SlashGroup[] = [
  {
    name: "format",
    title: "Format",
    actions: [
      ...commands.headings,
      {
        icon: Quote,
        name: "blockquote",
        tooltip: "Blockquote",
        onClick: (editor: Editor) => {
          editor.chain().focus().setBlockquote().run();
        },
      },
      {
        icon: SquareCode,
        name: "codeBlock",
        tooltip: "Code Block",
        onClick: (editor: Editor) => {
          editor.chain().focus().setCodeBlock().run();
        },
      },
      ...commands.lists,
    ],
  },
  {
    name: "insert",
    title: "Insert",
    actions: [
      ...commands.media,
      ...commands.table,
      ...commands.math,
      ...commands.diagram,
      {
        icon: Minus,
        name: "horizontalRule",
        tooltip: "Horizontal Rule",
        onClick: (editor: Editor) => {
          editor.chain().focus().setHorizontalRule().run();
        },
      },
      {
        icon: Lightbulb,
        name: "callOut",
        tooltip: "Callout",
        onClick: (editor: Editor) => {
          editor.chain().focus().setCallout().run();
        },
      },
    ],
  },
];

/** Filter the catalog by a `/query`, dropping groups with no matches. */
export function filterSlashGroups(query: string): SlashGroup[] {
  const normalized = query.toLowerCase().trim();
  return SLASH_GROUPS.map((group) => ({
    ...group,
    commands: group.actions.filter((item) =>
      item.tooltip.toLowerCase().trim().includes(normalized),
    ),
  })).filter((group) => group.commands.length > 0);
}
