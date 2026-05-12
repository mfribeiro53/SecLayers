export interface ToolHelp {
  goal: string;
  steps: string[];
  lookFor?: string;
}

export interface ToolMeta {
  summary: string;
  quickStart: string[];
  help?: ToolHelp;
}
