export {
	atomPenetrationDepth,
	effectivePenetrationThreshold,
	entrySideFromSelection,
	excludeAtomFromDragSelection,
	includeAtomInDragSelection,
	leaveSideFromPoint,
	resolveAtomLeave,
	selectionCoveringNode,
} from "./atom-selection.js";
export {
	restorePreservedSelection,
	selectAtomOnClick,
	shouldPreserveSelectionOnRightClick,
} from "./click-handlers.js";
export { hitAtomAtCoords, pointInRect } from "./hit-testing.js";
export { isAcrossSelectableNode } from "./node-classification.js";
export { SelectAcrossAtoms } from "./SelectAcrossAtoms.js";
export type { AtomVerticalSide, AtomVisit, PreservedRange } from "./types.js";
export { ATOM_SLIGHT_PENETRATION_PX } from "./types.js";
