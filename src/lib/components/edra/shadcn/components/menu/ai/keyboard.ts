import { AIState } from "../../../../commands/index.js";

export interface AiKeydownContext {
  aiActive: boolean;
  aiState: AIState;
  hasInput: boolean;
  actionCount: number;
  activeIndex: number;
}

export type AiKeydownResult =
  | { type: "close" }
  | { type: "submit" }
  | { type: "move"; index: number }
  | { type: "run"; index: number }
  | null;

/**
 * Pure keyboard resolver for the AI bubble menu. Keeps the component's
 * `<svelte:document onkeydown>` handler focused on applying the result.
 */
export function resolveAiKeydown(event: KeyboardEvent, context: AiKeydownContext): AiKeydownResult {
  const { aiActive, aiState, hasInput, actionCount, activeIndex } = context;

  if (!aiActive && aiState !== AIState.Confirmation) return null;
  if (event.key === "Escape") return { type: "close" };

  if (aiState !== AIState.Idle || !aiActive || actionCount === 0) return null;

  if (hasInput) {
    return event.key === "Enter" && !event.shiftKey ? { type: "submit" } : null;
  }

  if (event.key === "ArrowDown") {
    return { type: "move", index: (activeIndex + 1) % actionCount };
  }
  if (event.key === "ArrowUp") {
    return { type: "move", index: (activeIndex - 1 + actionCount) % actionCount };
  }
  if (event.key === "Enter") {
    return { type: "run", index: activeIndex };
  }
  return null;
}
