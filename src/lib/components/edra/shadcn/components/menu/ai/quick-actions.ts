import {
	ArrowDownWideNarrow,
	Brain,
	CheckCheck,
	Feather,
	PenLine,
	RefreshCcwDot,
	Sparkles,
	TextWrap,
} from '@lucide/svelte';

export type AiActionId =
	| 'improve'
	| 'grammer'
	| 'shorter'
	| 'longer'
	| 'simplify'
	| 'summarize'
	| 'continue'
	| 'solve';

export interface QuickAction {
	id: AiActionId;
	label: string;
	icon: typeof Sparkles;
}

export const QUICK_ACTIONS: readonly QuickAction[] = [
	{ id: 'improve', label: 'Improve writing', icon: Sparkles },
	{ id: 'grammer', label: 'Fix spelling & grammar', icon: CheckCheck },
	{ id: 'shorter', label: 'Make shorter', icon: ArrowDownWideNarrow },
	{ id: 'longer', label: 'Make longer', icon: TextWrap },
	{ id: 'simplify', label: 'Simplify language', icon: Feather },
	{ id: 'summarize', label: 'Summarize', icon: RefreshCcwDot },
	{ id: 'continue', label: 'Continue writing', icon: PenLine },
	{ id: 'solve', label: 'Solve problem', icon: Brain },
];
