import type { Editor } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { isTableSelected } from "./selection-utils.js";
import Table from "./table.js";

type GripCheckArgs = {
  editor: Editor;
  view: EditorView;
  state: EditorState;
  from: number;
};

function findTableCellContainer(view: EditorView, from: number): HTMLElement | null {
  const domAtPos = view.domAtPos(from).node as HTMLElement;
  const nodeDOM = view.nodeDOM(from) as HTMLElement;
  const node = nodeDOM || domAtPos;
  if (!node) return null;

  let container = node;
  while (container && !["TD", "TH"].includes(container.tagName)) {
    container = container.parentElement!;
  }
  return container;
}

export const isColumnGripSelected = (args: GripCheckArgs) => {
  const { editor, view, state, from } = args;
  const container = findTableCellContainer(view, from);

  if (!editor.isActive(Table.name) || !container || isTableSelected(state.selection)) {
    return false;
  }

  const gripColumn =
    container && container.querySelector && container.querySelector("a.grip-column.selected");

  return !!gripColumn;
};

export const isRowGripSelected = (args: GripCheckArgs) => {
  const { editor, view, state, from } = args;
  const container = findTableCellContainer(view, from);

  if (!editor.isActive(Table.name) || !container || isTableSelected(state.selection)) {
    return false;
  }

  const gripRow =
    container && container.querySelector && container.querySelector("a.grip-row.selected");

  return !!gripRow;
};

/** Find the closest <tr> ancestor from a cell container */
function findRowFromContainer(container: HTMLElement | null): HTMLTableRowElement | null {
  return container?.closest("tr") ?? null;
}

/** Get the selection anchor cell's <tr> */
function getAnchorRow(view: EditorView, state: EditorState): HTMLTableRowElement | null {
  const anchorDom = view.domAtPos(state.selection.$from.pos).node as HTMLElement;
  let anchorCell = anchorDom;
  while (anchorCell && !["TD", "TH"].includes(anchorCell.tagName)) {
    anchorCell = anchorCell.parentElement!;
  }
  return findRowFromContainer(anchorCell);
}

/** Get the column index of a cell within its row */
function getColumnIndex(cell: HTMLElement): number {
  const row = cell.closest("tr");
  if (!row) return -1;
  const cells = Array.from(row.children).filter(
    (el) => (el as HTMLElement).tagName === "TD" || (el as HTMLElement).tagName === "TH",
  );
  return cells.indexOf(cell);
}

// Show row menu when a cell in that row is selected (DOM-based)
export const isRowActiveFromSelection = (args: GripCheckArgs) => {
  const { editor, view, state, from } = args;
  if (!editor.isActive(Table.name)) return false;

  const container = findTableCellContainer(view, from);
  if (!container) return false;

  const rowEl = findRowFromContainer(container);
  if (!rowEl) return false;

  const anchorRow = getAnchorRow(view, state);
  return !!anchorRow && anchorRow === rowEl;
};

// Show column menu when a cell in that column is selected (DOM-based)
export const isColumnActiveFromSelection = (args: GripCheckArgs) => {
  const { editor, view, state, from } = args;
  if (!editor.isActive(Table.name)) return false;

  const container = findTableCellContainer(view, from);
  if (!container) return false;

  const containerIndex = getColumnIndex(container);
  if (containerIndex < 0) return false;

  const anchorDom = view.domAtPos(state.selection.$from.pos).node as HTMLElement;
  let anchorCell = anchorDom;
  while (anchorCell && !["TD", "TH"].includes(anchorCell.tagName)) {
    anchorCell = anchorCell.parentElement!;
  }
  if (!anchorCell) return false;

  const anchorIndex = getColumnIndex(anchorCell);
  return anchorIndex === containerIndex;
};

/** Whether the given DOM node sits inside a table with a selected row/column grip. */
export function isTableGripSelected(node: HTMLElement): boolean {
  let container: HTMLElement | null = node;
  while (container && !["TD", "TH"].includes(container.tagName)) {
    container = container.parentElement;
  }
  if (!container) return false;

  const gripColumn = container.querySelector("a.grip-column.selected");
  const gripRow = container.querySelector("a.grip-row.selected");
  return Boolean(gripColumn ?? gripRow);
}
