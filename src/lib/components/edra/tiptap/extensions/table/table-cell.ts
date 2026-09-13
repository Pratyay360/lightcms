import { TableCell as TiptapTableCell } from "@tiptap/extension-table";
import { Plugin } from "@tiptap/pm/state";
import { addRowAfter } from "@tiptap/pm/tables";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import strings from "../../../strings.js";

import { createGripInteractionPlugin } from "./grip-interaction.js";
import { getCellsInColumn, isRowSelected, selectRow } from "./utils.js";

export const TableCell = TiptapTableCell.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            if (!this.editor.isEditable) {
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
                    this.editor.commands.focus();
                    addRowAfter(this.editor.state, this.editor.view.dispatch);
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
        isLast: (table, index) => index === table.rows.length - 1,
      }),
    ];
  },
});

export default TableCell;
