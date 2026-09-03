import { eq, asc } from "drizzle-orm";
import type { AppDatabase } from "@/infrastructure/adapters/database/postgres";
import { manifestoItems, pages } from "@/infrastructure/db/schema";
import { DEFAULT_TENANT_ID } from "@/infrastructure/db/schema";

export class ContentService {
  constructor(private readonly db: AppDatabase) {}

  async listManifesto(publishedOnly = true) {
    const rows = await this.db
      .select()
      .from(manifestoItems)
      .where(eq(manifestoItems.tenantId, DEFAULT_TENANT_ID))
      .orderBy(asc(manifestoItems.sortOrder));

    return publishedOnly ? rows.filter((r) => r.published) : rows;
  }

  async getManifestoBySlug(slug: string) {
    const [row] = await this.db
      .select()
      .from(manifestoItems)
      .where(eq(manifestoItems.slug, slug))
      .limit(1);
    return row ?? null;
  }

  async upsertManifesto(data: {
    id?: string;
    slug: string;
    theme: string;
    sortOrder: number;
    titleHi: string;
    titleEn: string;
    bodyHi: string;
    bodyEn: string;
    published: boolean;
  }) {
    if (data.id) {
      const [updated] = await this.db
        .update(manifestoItems)
        .set({
          slug: data.slug,
          theme: data.theme,
          sortOrder: data.sortOrder,
          titleHi: data.titleHi,
          titleEn: data.titleEn,
          bodyHi: data.bodyHi,
          bodyEn: data.bodyEn,
          published: data.published,
          updatedAt: new Date(),
        })
        .where(eq(manifestoItems.id, data.id))
        .returning();
      return updated!;
    }

    const [created] = await this.db
      .insert(manifestoItems)
      .values({
        tenantId: DEFAULT_TENANT_ID,
        ...data,
      })
      .returning();
    return created!;
  }

  async deleteManifesto(id: string) {
    await this.db.delete(manifestoItems).where(eq(manifestoItems.id, id));
  }

  async getPage(slug: string) {
    const [row] = await this.db
      .select()
      .from(pages)
      .where(eq(pages.slug, slug))
      .limit(1);
    return row ?? null;
  }

  async upsertPage(data: {
    slug: string;
    titleHi: string;
    titleEn: string;
    bodyHi: string;
    bodyEn: string;
  }) {
    const existing = await this.getPage(data.slug);
    if (existing) {
      const [updated] = await this.db
        .update(pages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(pages.id, existing.id))
        .returning();
      return updated!;
    }

    const [created] = await this.db
      .insert(pages)
      .values({ tenantId: DEFAULT_TENANT_ID, ...data })
      .returning();
    return created!;
  }

  async ensureDefaultPages() {
    const defaults = [
      {
        slug: "about",
        titleHi: "हमारे बारे में",
        titleEn: "About Us",
        bodyHi:
          "यह वार्ड चुनाव अभियान की आधिकारिक वेबसाइट है। हमारा लक्ष्य पारदर्शिता और जनभागीदारी है।",
        bodyEn:
          "This is the official ward election campaign website. Our goal is transparency and public participation.",
      },
      {
        slug: "panch-scope",
        titleHi: "वार्ड पंच की सीमाएँ",
        titleEn: "Scope of Ward Panch",
        bodyHi:
          "वार्ड पंच कुछ स्थानीय मुद्दों पर काम कर सकते हैं। बड़े मुद्दों के लिए उच्च अधिकारियों तक याचिका भेजी जा सकती है।",
        bodyEn:
          "The ward panch can work on certain local issues. Larger issues may require petitions to higher authorities.",
      },
    ];

    for (const page of defaults) {
      const existing = await this.getPage(page.slug);
      if (!existing) await this.upsertPage(page);
    }
  }
}
