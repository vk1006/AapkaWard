# Ward Campaign — Product Blueprint

## Vision

A ward-local civic + campaign platform: manifesto, moderated suggestions, events with RSVP. Issues and petitions ship behind feature flags for Phase 2.

## Modules

| Module | Phase 1 | Notes |
|--------|---------|-------|
| Identity | Live | Phone OTP, sessions, roles |
| Content | Live | Manifesto, about, panch-scope |
| Suggestions | Live | Moderated, rate-limited |
| Events | Live | RSVP, WhatsApp share |
| Moderation | Live | Blocklist + admin queue |
| Platform | Live | Flags, audit, rate limits |
| Issues | Schema only | Flag `issues` |
| Petitions | Schema only | Flag `petitions` |

## Extensibility

All external systems use ports:

- `OtpPort` — Firebase today, MSG91 tomorrow
- `FileStorePort` — local disk today, S3 tomorrow
- `DatabasePort` — Postgres via Drizzle; swap connection or adapter
- `ModerationProviderPort` — blocklist today, LLM tomorrow

Configure via environment variables only — domain code unchanged.

## Scale targets

- 10k registered users
- ~100 DAU / ~100 concurrent typical
- Spike: 1k concurrent via cached public pages

## Hindi-first i18n

- Default locale: `hi`
- UI messages in `messages/hi.json`, `messages/en.json`
- Editorial content: dual-authored `titleHi`/`titleEn` fields

## Legal

- Petitions are civic pressure tools, not official government filings
- Content freeze flag for Model Code of Conduct periods
- No 100% ward signature requirement — use numeric thresholds
