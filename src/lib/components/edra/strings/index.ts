import { commandStrings } from "./commands.js";
import { dragHandleStrings, editorStrings } from "./editor.js";
import {
	audioStrings,
	codeStrings,
	iframeStrings,
	imageStrings,
	mediaStrings,
	tableStrings,
	videoStrings,
} from "./extensions.js";
import { menuStrings, toolbarStrings } from "./menu-toolbar.js";

const strings = {
	command: commandStrings,
	dragHandle: dragHandleStrings,
	editor: editorStrings,
	extension: {
		audio: audioStrings,
		code: codeStrings,
		iframe: iframeStrings,
		image: imageStrings,
		media: mediaStrings,
		table: tableStrings,
		video: videoStrings,
	},
	menu: menuStrings,
	toolbar: toolbarStrings,
};

export default strings;
