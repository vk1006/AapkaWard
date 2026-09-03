import type { DatabasePort } from "@/infrastructure/ports/database";
import type { OtpPort } from "@/infrastructure/ports/otp";
import type { FileStorePort } from "@/infrastructure/ports/file-store";
import type { ModerationProviderPort } from "@/infrastructure/ports/moderation";
import type { ClockPort } from "@/infrastructure/ports/clock";
import type { EventBusPort } from "@/infrastructure/ports/event-bus";
import { getDatabaseAdapter } from "@/infrastructure/adapters/database/postgres";
import { FirebaseOtpAdapter } from "@/infrastructure/adapters/otp/firebase";
import { MockOtpAdapter } from "@/infrastructure/adapters/otp/mock";
import { LocalFileAdapter } from "@/infrastructure/adapters/storage/local";
import { S3FileAdapter } from "@/infrastructure/adapters/storage/s3";
import { BlocklistModerationAdapter } from "@/infrastructure/adapters/moderation/blocklist";
import { SystemClockAdapter } from "@/infrastructure/adapters/clock/system";
import { OutboxEventBusAdapter } from "@/infrastructure/adapters/event-bus/outbox";
import { PlatformService } from "@/modules/platform/service";
import { IdentityService } from "@/modules/identity/service";
import { ContentService } from "@/modules/content/service";
import { ModerationService } from "@/modules/moderation/service";
import { SuggestionsService } from "@/modules/suggestions/service";
import { EventsService } from "@/modules/events/service";
import { IssuesService } from "@/modules/issues/service";
import { PetitionsService } from "@/modules/petitions/service";
import { AdminCommentsService } from "@/modules/admin-comments/service";

export interface Container {
  database: DatabasePort;
  otp: OtpPort;
  fileStore: FileStorePort;
  moderation: ModerationProviderPort;
  clock: ClockPort;
  eventBus: EventBusPort;
  platform: PlatformService;
  identity: IdentityService;
  content: ContentService;
  moderationService: ModerationService;
  suggestions: SuggestionsService;
  events: EventsService;
  issues: IssuesService;
  petitions: PetitionsService;
  adminComments: AdminCommentsService;
}

let container: Container | null = null;

function createOtpAdapter(): OtpPort {
  const adapter = process.env.OTP_ADAPTER ?? "mock";
  if (adapter === "firebase") return new FirebaseOtpAdapter();
  if (adapter === "mock") return new MockOtpAdapter();
  throw new Error(`Unknown OTP_ADAPTER: ${adapter}`);
}

function createFileStoreAdapter(): FileStorePort {
  const adapter = process.env.FILE_STORE_ADAPTER ?? "local";
  if (adapter === "local") {
    return new LocalFileAdapter(process.env.UPLOAD_DIR ?? "./uploads");
  }
  if (adapter === "s3" || adapter === "r2") return new S3FileAdapter();
  throw new Error(`Unknown FILE_STORE_ADAPTER: ${adapter}`);
}

function createModerationAdapter(): ModerationProviderPort {
  const adapter = process.env.MODERATION_ADAPTER ?? "blocklist";
  if (adapter === "blocklist") return new BlocklistModerationAdapter();
  throw new Error(`Unknown MODERATION_ADAPTER: ${adapter}`);
}

export function getContainer(): Container {
  if (container) return container;

  const database = getDatabaseAdapter();
  const db = database.getDb();
  const clock = new SystemClockAdapter();
  const eventBus = new OutboxEventBusAdapter(() => db);
  const platform = new PlatformService(db, clock, eventBus);
  const adminComments = new AdminCommentsService(db, platform);
  const identity = new IdentityService(db, clock);
  const content = new ContentService(db);
  const moderationService = new ModerationService(db, createModerationAdapter());
  const suggestions = new SuggestionsService(db, moderationService, platform, clock, adminComments);
  const events = new EventsService(db, clock);
  const fileStore = createFileStoreAdapter();
  const issues = new IssuesService(db, moderationService, platform, fileStore, adminComments);
  const petitions = new PetitionsService(db, platform, eventBus, clock);

  container = {
    database,
    otp: createOtpAdapter(),
    fileStore,
    moderation: createModerationAdapter(),
    clock,
    eventBus,
    platform,
    identity,
    content,
    moderationService,
    suggestions,
    events,
    issues,
    petitions,
    adminComments,
  };

  return container;
}
