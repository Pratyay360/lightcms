import Table from "@lucide/svelte/icons/table";
import strings from "../strings.js";
import type { EdraCommand } from "./types.js";

export const tableCommands: EdraCommand[] = [
	{
		icon: Table,
		name: "table",
		tooltip: strings.command.table,
		onClick: (editor) => {
			if (editor.isActive("table")) {
				const del = confirm("Do you really want to delete this table??");
				if (del) {
					editor.chain().focus().deleteTable().run();
					return;
				}
			}
			editor
				.chain()
				.focus()
				.insertTable({ cols: 3, rows: 3, withHeaderRow: false })
				.run();
		},
		isActive: (editor) => editor.isActive("table"),
	},
];
