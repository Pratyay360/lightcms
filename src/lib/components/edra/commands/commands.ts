import type { EdraCommand } from "./types.js";

export type { EdraCommand } from "./types.js";

import { alignmentCommands } from "./alignment.js";
import { diagramCommands } from "./diagram.js";
import { headingCommands } from "./headings.js";
import { historyCommands } from "./history.js";
import { listCommands } from "./lists.js";
import { mathCommands } from "./math.js";
import { mediaCommands } from "./media.js";
import { tableCommands } from "./table.js";
import { textFormattingCommands } from "./text-formatting.js";

export const commands: Record<string, EdraCommand[]> = {
  "undo-redo": historyCommands,
  headings: headingCommands,
  "text-formatting": textFormattingCommands,
  alignment: alignmentCommands,
  lists: listCommands,
  media: mediaCommands,
  table: tableCommands,
  math: mathCommands,
  diagram: diagramCommands,
};
