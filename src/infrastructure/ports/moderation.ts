export type ModerationVerdict = "allow" | "review" | "block";

export interface ModerationResult {
  verdict: ModerationVerdict;
  scores: Record<string, number>;
  reason?: string;
}

export interface ModerationProviderPort {
  evaluate(input: { text: string; locale: string }): Promise<ModerationResult>;
}
