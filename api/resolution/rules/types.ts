import type { ResolutionResult } from "../resolutionEngine";

export interface ResolutionContext {
  inboxDocument: any;
  analysis: any;
}

export interface ResolutionRule {
  name: string;
  execute(context: ResolutionContext): Promise<ResolutionResult | null>;
}