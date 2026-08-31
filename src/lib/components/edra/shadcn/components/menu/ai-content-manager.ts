import type { Editor } from "@tiptap/core";
import { removeAIHighlight } from "../../../tiptap/index.js";

export interface AIContentManagerState {
	aiContentFrom: number;
	aiContentTo: number;
	originalFrom: number;
	aiResponse: string;
	lastPrompt: string;
	generating: boolean;
	updateTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Manages AI-generated content streaming into a TipTap editor.
 * Handles insertion, replacement, cleanup, and highlighting of AI content.
 */
export function createAIContentManager(editor: Editor) {
	const state: AIContentManagerState = {
		aiContentFrom: 0,
		aiContentTo: 0,
		originalFrom: 0,
		aiResponse: "",
		lastPrompt: "",
		generating: false,
		updateTimer: null,
	};

	/** Throttle editor updates to ~100ms to avoid excessive transactions */
	function scheduleEditorUpdate(onFlush: () => void) {
		if (state.updateTimer) return;
		state.updateTimer = setTimeout(() => {
			onFlush();
			state.updateTimer = null;
		}, 100);
	}

	/** Insert or replace the AI content region in the editor with the accumulated response */
	function flushEditorUpdate() {
		if (state.updateTimer) {
			clearTimeout(state.updateTimer);
			state.updateTimer = null;
		}
		if (!state.aiResponse) return;

		try {
			const oldDocSize = editor.state.doc.content.size;

			if (state.aiContentFrom >= state.aiContentTo) {
				editor
					.chain()
					.command(({ tr }) => {
						tr.setMeta("addToHistory", false);
						return true;
					})
					.insertContentAt(state.aiContentFrom, state.aiResponse, {
						contentType: "markdown",
					})
					.run();
			} else {
				editor
					.chain()
					.command(({ tr }) => {
						tr.setMeta("addToHistory", false);
						return true;
					})
					.insertContentAt(
						{ from: state.aiContentFrom, to: state.aiContentTo },
						state.aiResponse,
						{
							contentType: "markdown",
						},
					)
					.run();
			}

			const newDocSize = editor.state.doc.content.size;
			state.aiContentTo = newDocSize - (oldDocSize - state.aiContentTo);

			const tr = editor.state.tr;
			tr.setMeta("addToHistory", false);
			tr.addMark(
				state.aiContentFrom,
				state.aiContentTo,
				editor.state.schema.marks["ai-highlight"].create({
					color: "var(--color-muted)",
				}),
			);
			editor.view.dispatch(tr);

			if (state.aiContentTo > 1) {
				editor.commands.setTextSelection(state.aiContentTo - 1);
			}
		} catch (error) {
			console.error("Error updating editor with AI content:", error);
		}
	}

	/** Remove AI-generated content from the editor (without adding to undo history) */
	function cleanupAIContent() {
		if (state.aiContentFrom < state.aiContentTo) {
			try {
				editor
					.chain()
					.command(({ tr }) => {
						tr.setMeta("addToHistory", false);
						return true;
					})
					.deleteRange({
						from: state.aiContentFrom,
						to: state.aiContentTo,
					})
					.run();
				state.aiContentTo = state.aiContentFrom;
			} catch (error) {
				console.error("Error cleaning up AI content:", error);
			}
		}
	}

	/** Replace: delete original selection, keep AI text */
	function replaceSelection() {
		try {
			const response = state.aiResponse;
			editor
				.chain()
				.deleteRange({ from: state.originalFrom, to: state.aiContentTo })
				.run();
			editor
				.chain()
				.insertContentAt(state.originalFrom, response, {
					contentType: "markdown",
				})
				.run();
			removeAIHighlight(editor);
		} catch (error) {
			console.error(error);
		}
	}

	/** Insert below: AI text is already below the selection — just accept */
	function insertNext() {
		removeAIHighlight(editor);
	}

	/** Copy AI response to clipboard */
	function copyToClipboard() {
		window.navigator.clipboard.writeText(state.aiResponse);
	}

	/** Retry: delete AI content, re-run with same prompt */
	function retry(onRetry: (prompt: string) => void) {
		cleanupAIContent();
		state.aiResponse = "";
		if (state.lastPrompt) {
			onRetry(state.lastPrompt);
		}
	}

	/** Discard: delete AI content, keep original, reset */
	function discardChanges() {
		cleanupAIContent();
		removeAIHighlight(editor);
		state.aiResponse = "";
	}

	/** Close AI: full cleanup */
	function closeAI(stopGenerating: () => void) {
		stopGenerating();
		cleanupAIContent();
		removeAIHighlight(editor);
		state.aiResponse = "";
		state.lastPrompt = "";
	}

	/** Initialize positions for a new AI generation */
	function initGeneration(prompt: string, isRetry: boolean) {
		state.generating = true;
		state.lastPrompt = prompt;
		state.aiResponse = "";
		if (!isRetry) {
			const { from, to } = editor.state.selection;
			state.originalFrom = from;
			const to_ = editor.state.doc.resolve(to);
			const depth = Math.min(to_.depth, 1) || 1;
			state.aiContentFrom = to_.after(depth);
			state.aiContentTo = state.aiContentFrom;
		} else {
			state.aiContentTo = state.aiContentFrom;
		}
	}

	return {
		state,
		scheduleEditorUpdate,
		flushEditorUpdate,
		cleanupAIContent,
		replaceSelection,
		insertNext,
		copyToClipboard,
		retry,
		discardChanges,
		closeAI,
		initGeneration,
	};
}
