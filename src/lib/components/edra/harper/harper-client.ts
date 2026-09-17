import { type Lint, type Linter, WorkerLinter } from "harper.js";
import { binary } from "harper.js/binary";
import type { HarperIssue } from "./types.ts";

let linterPromise: Promise<Linter> | null = null;
let issueCounter = 0;

const nextIssueId = (): string => {
  issueCounter += 1;
  return `harper-${issueCounter}`;
};

const createLinter = async (): Promise<Linter> => {
  const worker = new WorkerLinter({ binary });
  await worker.setup();
  return worker;
};

const getLinter = (): Promise<Linter> => {
  linterPromise ??= createLinter();
  return linterPromise;
};

const projectLint = (lint: Lint): HarperIssue => {
  const span = lint.span();
  const suggestions: string[] = [];
  for (let i = 0; i < lint.suggestion_count(); i += 1) {
    suggestions.push(lint.suggestions()[i].get_replacement_text());
  }
  return {
    id: nextIssueId(),
    from: span.start,
    to: span.end,
    message: lint.message(),
    suggestions,
  };
};

export const lintText = async (text: string): Promise<HarperIssue[]> => {
  if (!text.trim()) {
    return [];
  }
  const linter = await getLinter();
  const lints = await linter.lint(text, { language: "plaintext" });
  return lints.map(projectLint);
};

export const primeHarper = (): void => {
  void getLinter();
};
