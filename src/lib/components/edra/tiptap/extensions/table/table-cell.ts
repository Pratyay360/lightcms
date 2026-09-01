import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import strings from "../../../strings.ts";

import { createGripInteractionPlugin } from "./grip-interaction.js";
import { getCellsInColumn, isRowSelected, selectRow } from "./utils.js";

export interface TableCellOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const TableCell = Node.create<TableCellOptions>({
  name: "tableCell",

  content: "block+",
  tableRole: "cell",

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addAttributes() {
    return {
      colspan: {
        default: 1,
        parseHTML: (element) => {
          const colspan = element.getAttribute("colspan");
          const value = colspan ? Number.parseInt(colspan, 10) : 1;

          return value;
        },
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => {
          const rowspan = element.getAttribute("rowspan");
          const value = rowspan ? Number.parseInt(rowspan, 10) : 1;

          return value;
        },
      },
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const colwidth = element.getAttribute("colwidth");
          const value = colwidth ? [Number.parseInt(colwidth, 10)] : null;

          return value;
        },
      },
      style: {
        default: null,
      },
    };
  },

  addProseMirrorPlugins() {
    const { isEditable } = this.editor;

    return [
      new Plugin({
        props: {
          decorations: (state) => {
            if (!isEditable) {
              return DecorationSet.empty;
            }

            const { doc, selection } = state;
            const decorations: Decoration[] = [];
            const firstColCells = getCellsInColumn(0)(selection);

            // Row grips (left edge) — appear for first column cells
            if (firstColCells) {
              firstColCells.forEach(({ pos }: { pos: number }, index: number) => {
                decorations.push(
                  Decoration.widget(pos + 1, () => {
                    const rowSelected = isRowSelected(index)(selection);
                    let className = "grip-row";

                    if (rowSelected) {
                      className += " selected";
                    }

                    if (index === 0) {
                      className += " first";
                    }

                    if (index === firstColCells.length - 1) {
                      className += " last";
                    }

                    const grip = document.createElement("a");

                    grip.className = className;
                    grip.setAttribute("role", "button");
                    grip.setAttribute("aria-label", strings.extension.table.selectRow);
                    grip.setAttribute("tabindex", "0");
                    grip.dataset.rowIndex = String(index);
                    grip.addEventListener("mousedown", (event) => {
                      event.preventDefault();
                      event.stopImmediatePropagation();

                      this.editor.view.dispatch(selectRow(index)(this.editor.state.tr));
                    });

                    return grip;
                  }),
                );
              });
            }

            // Add-row "+" button — anchored to the last row (first column)
            if (firstColCells && firstColCells.length > 0) {
              const lastRowCell = firstColCells[firstColCells.length - 1];
              decorations.push(
                Decoration.widget(lastRowCell.pos + 1, () => {
                  const btn = document.createElement("button");
                  btn.className = "add-row-btn";
                  btn.type = "button";
                  btn.setAttribute("aria-label", strings.extension.table.addRow);
                  btn.setAttribute("title", strings.extension.table.addRowAfter);
                  btn.textContent = "+";
                  btn.addEventListener("mousedown", (event) => {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    // Select last row, then add after
                    this.editor.view.dispatch(
                      selectRow(firstColCells.length - 1)(this.editor.state.tr),
                    );
                    this.editor.chain().focus().addRowAfter().run();
                  });
                  return btn;
                }),
              );
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
      // Shared interaction plugin — toggles grip visibility on hover/click
      createGripInteractionPlugin({
        gripSelector: "grip-row",
        showClass: "show-row-grip",
        hoverClass: "last-row-hover",
        getIndex: (cell) => (cell.parentElement as HTMLTableRowElement).rowIndex,
      }),
    ];
  },
});
