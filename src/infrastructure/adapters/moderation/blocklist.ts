import blocklistData from "@/infrastructure/blocklist.json";
import type {
  ModerationProviderPort,
  ModerationResult,
} from "@/infrastructure/ports/moderation";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

export class BlocklistModerationAdapter implements ModerationProviderPort {
  private readonly terms: string[];

  constructor(terms: string[] = blocklistData.terms) {
    this.terms = terms.map((t) => normalize(t));
  }

  async evaluate(input: { text: string; locale: string }): Promise<ModerationResult> {
    const normalized = normalize(input.text);
    const hits: string[] = [];

    for (const term of this.terms) {
      if (term.length > 2 && normalized.includes(term)) {
        hits.push(term);
      }
    }

    if (hits.length > 0) {
      return {
        verdict: "block",
        scores: { blocklist: 1 },
        reason: "blocked_term",
      };
    }

    if (input.text.trim().length < 10) {
      return { verdict: "review", scores: { too_short: 1 } };
    }

    return { verdict: "review", scores: { default_review: 1 } };
  }
}
