export interface HarperIssue {
  id: string;
  from: number;
  to: number;
  message: string;
  suggestions: string[];
}

export interface HarperLintResult {
  text: string;
  issues: HarperIssue[];
}
