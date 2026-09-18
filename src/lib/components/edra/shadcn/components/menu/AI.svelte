<script lang="ts">
	import { toast } from 'svelte-sonner';
	import {
		AIState,
		CONTINUE_WRITING_PROMPT,
		FIX_GRAMMAR_PROMPT,
		IMPROVE_WRITING_PROMPT,
		MAKE_LONGER_PROMPT,
		MAKE_SHORTER_PROMPT,
		SIMPLIFY_LANGUAGE_PROMPT,
		SOLVE_PROBLEM_PROMPT,
		SUMMARIZE_PROMPT,
	} from '../../../commands/index.js';
	import { BubbleMenu, getEditor, removeAIHighlight, useEditorTransaction } from '../../../tiptap/index.js';
	import AiActionBar from './ai/AiActionBar.svelte';
	import AiPromptForm from './ai/AiPromptForm.svelte';
	import AiQuickActions from './ai/AiQuickActions.svelte';
	import AiStreamingIndicator from './ai/AiStreamingIndicator.svelte';
	import { resolveAiKeydown } from './ai/keyboard.js';
	import { type AiActionId, QUICK_ACTIONS, type QuickAction } from './ai/quick-actions.js';
	import { createAIContentManager } from './ai-content-manager.js';

	const editor = getEditor();
	const manager = createAIContentManager(editor);
	const transaction = useEditorTransaction(editor);

	const PROMPT_BUILDERS: Record<AiActionId, (text: string) => string> = {
		improve: IMPROVE_WRITING_PROMPT,
		grammer: FIX_GRAMMAR_PROMPT,
		shorter: MAKE_SHORTER_PROMPT,
		longer: MAKE_LONGER_PROMPT,
		simplify: SIMPLIFY_LANGUAGE_PROMPT,
		summarize: SUMMARIZE_PROMPT,
		continue: CONTINUE_WRITING_PROMPT,
		solve: SOLVE_PROBLEM_PROMPT,
	};

	let inputTag = $state<HTMLTextAreaElement | null>(null);
	let inputValue = $state('');
	let aiState = $state(AIState.Idle);
	let aiResponse = $state('');
	let activeOptionIndex = $state(0);
	let generating = $state(false);

	const activeCallAI = $derived(
		editor.extensionManager.extensions.find((e) => e.name === 'ai-highlight')?.options?.callAI
	);

	function isAIActive(): boolean {
		void transaction.version;
		return editor.isActive('ai-highlight');
	}

	function getAIHighlightedText(): string | undefined {
		void transaction.version;
		let range = { from: -1, to: -1 };
		editor.state.doc.descendants((node, pos) => {
			if (node.marks.some((mark) => mark.type.name === 'ai-highlight')) {
				if (range.from === -1) range.from = pos;
				range.to = pos + node.nodeSize;
			}
		});
		if (range.from === -1 || range.to === -1) return undefined;
		const slice = editor.view.state.doc.cut(range.from, range.to);
		if (editor.markdown) return editor.markdown.serialize(slice.toJSON());
		return editor.state.doc.textBetween(range.from, range.to);
	}

	async function generateAIContent(prompt: string, isRetry = false) {
		generating = true;
		manager.initGeneration(prompt, isRetry);
		aiResponse = '';

		try {
			const onChunk = (chunk: string) => {
				aiResponse += chunk;
				manager.state.aiResponse = aiResponse;
				manager.scheduleEditorUpdate(() => manager.flushEditorUpdate());
			};
			const onError = (error: Error) => {
				toast.error('Something went wrong when calling AI.', {
					description: error.message,
				});
				console.error(error);
				manager.cleanupAIContent();
				removeAIHighlight(editor);
				aiState = AIState.Idle;
				aiResponse = '';
				generating = false;
			};

			if (activeCallAI) {
				await activeCallAI(prompt, onChunk, onError);
			}
			manager.flushEditorUpdate();
		} finally {
			generating = false;
		}
	}

	async function processText(action: AiActionId) {
		const id = Symbol('AI_THINKING_TOAST').toString();
		const selectedText = getAIHighlightedText();
		if (!selectedText?.trim()) {
			toast.error('Can not get the selected content from editor', { id });
			return;
		}
		try {
			aiState = AIState.Confirmation;
			await generateAIContent(PROMPT_BUILDERS[action](selectedText));
		} catch (error) {
			aiState = AIState.Idle;
			console.error(error);
			toast.error('Something went wrong! Check console.', { id });
		}
	}

	async function handleSubmit() {
		const prompt = inputValue.trim();
		if (!prompt) return;
		const text = getAIHighlightedText() ?? '';
		try {
			inputValue = '';
			aiState = AIState.Confirmation;
			await generateAIContent(`${text}\n\n\n${prompt}`);
		} catch (error) {
			aiState = AIState.Idle;
			console.error(error);
			toast.error('Something went wrong! Check console.');
		}
	}

	function replaceSelection() {
		manager.replaceSelection();
		aiState = AIState.Idle;
		aiResponse = '';
	}

	function insertNext() {
		manager.insertNext();
		aiState = AIState.Idle;
		aiResponse = '';
	}

	function copyToClipboard() {
		void manager.copyToClipboard();
		toast.success('Copied to clipboard');
	}

	function retry() {
		manager.retry((prompt) => {
			void generateAIContent(prompt, true);
		});
	}

	function discardChanges() {
		manager.discardChanges();
		aiState = AIState.Idle;
		aiResponse = '';
	}

	function closeAI() {
		manager.closeAI(() => {
			generating = false;
		});
		aiState = AIState.Idle;
		aiResponse = '';
	}

	function scrollActiveOptionIntoView() {
		setTimeout(() => {
			const activeEl = document.querySelector('.quick-action-active');
			if (activeEl) {
				activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}, 0);
	}

	function handleKeydown(event: KeyboardEvent) {
		const result = resolveAiKeydown(event, {
			aiActive: isAIActive(),
			aiState,
			hasInput: inputValue.trim().length > 0,
			actionCount: QUICK_ACTIONS.length,
			activeIndex: activeOptionIndex,
		});
		if (!result) return;

		event.preventDefault();

		if (result.type === 'close') {
			closeAI();
			return;
		}
		if (result.type === 'submit') {
			void handleSubmit();
			return;
		}
		if (result.type === 'move') {
			activeOptionIndex = result.index;
			scrollActiveOptionIntoView();
			return;
		}
		const action = QUICK_ACTIONS[result.index];
		if (action) {
			void processText(action.id);
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<BubbleMenu
	{editor}
	pluginKey="ai-bubble-menu"
	shouldShow={(props) => {
		const { editor: propsEditor, view } = props;
		if (!propsEditor?.isEditable || propsEditor?.isDestroyed) return false;
		if (!view || propsEditor.view.dragging) return false;

		// Always show during AI confirmation (streaming or action bar)
		if (aiState === AIState.Confirmation) return true;

		if (propsEditor.isActive('ai-highlight')) return true;

		removeAIHighlight(propsEditor);
		aiState = AIState.Idle;
		aiResponse = '';
		return false;
	}}
	class="absolute z-100 flex max-h-120 max-w-3xl flex-col p-0 transition-[height] duration-500"
	options={{
		strategy: 'absolute',
		autoPlacement: {
			allowedPlacements: ['bottom-start', 'top-start']
		},
		scrollTarget: editor.view.dom.parentElement ?? window,
		onShow() {
			activeOptionIndex = 0;
			inputTag?.focus({ preventScroll: true });
		},
		onHide() {
			inputTag?.blur();
		}
	}}
>
	{#if aiState === AIState.Idle}
		<div class="flex w-xl flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl backdrop-blur-2xl">
			<AiPromptForm bind:value={inputValue} bind:inputRef={inputTag} onSubmit={handleSubmit} />

			{#if isAIActive() && !inputValue.trim()}
				<AiQuickActions
					actions={QUICK_ACTIONS}
					activeIndex={activeOptionIndex}
					onSelect={(action: QuickAction) => void processText(action.id)}
					onHover={(index: number) => (activeOptionIndex = index)}
				/>
			{/if}
		</div>
	{:else if aiState === AIState.Confirmation}
		{#if generating}
			<AiStreamingIndicator />
		{:else}
			<AiActionBar
				onReplace={replaceSelection}
				onInsert={insertNext}
				onCopy={copyToClipboard}
				onRetry={retry}
				onDiscard={discardChanges}
			/>
		{/if}
	{/if}
</BubbleMenu>
