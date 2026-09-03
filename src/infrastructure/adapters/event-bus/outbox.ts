import { eq, isNull } from "drizzle-orm";
import type { EventBusPort, DomainEvent } from "@/infrastructure/ports/event-bus";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import { outbox } from "@/infrastructure/db/schema";

export class OutboxEventBusAdapter implements EventBusPort {
  constructor(private readonly getDb: () => AppDatabase) {}

  async publish(event: DomainEvent): Promise<void> {
    const db = this.getDb();
    await db.insert(outbox).values({
      topic: event.topic,
      payload: event.payload,
    });
  }

  async processPending(limit = 50): Promise<void> {
    const db = this.getDb();
    const pending = await db
      .select()
      .from(outbox)
      .where(isNull(outbox.processedAt))
      .limit(limit);

    for (const item of pending) {
      // In-process dispatcher — extend with handlers per topic later
      await db
        .update(outbox)
        .set({ processedAt: new Date() })
        .where(eq(outbox.id, item.id));
    }
  }
}
