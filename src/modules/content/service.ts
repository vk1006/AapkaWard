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

  async listPages() {
    return this.db
      .select()
      .from(pages)
      .where(eq(pages.tenantId, DEFAULT_TENANT_ID))
      .orderBy(asc(pages.slug));
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
        titleHi: "आपका वार्ड के बारे में",
        titleEn: "About Aapka Ward",
        bodyHi: `आपका वार्ड आपके इलाके की आधिकारिक जन-सहभागिता प्लेटफ़ॉर्म है।

यहाँ आप वार्ड की समस्याएँ दर्ज कर सकते हैं, विकास के सुझाव दे सकते हैं, कार्यक्रमों में भाग ले सकते हैं और प्राथमिकताएँ जान सकते हैं — सब कुछ एक ही जगह, सरल और पारदर्शी तरीके से।

हमारा उद्देश्य है कि हर निवासी की आवाज़ सुनी जाए, जवाबदेही बनी रहे और वार्ड के विकास में आपकी सीधी भागीदारी हो।

यह प्लेटफ़ॉर्म खुला है — कोई भी पंजीकृत निवासी सुझाव दे सकता है। अशिष्ट या व्यक्तिगत हमला वाली सामग्री प्रकाशित नहीं की जाती।`,
        bodyEn: `Aapka Ward is your neighbourhood's official participation platform.

Here you can report ward issues, share development suggestions, join events, and explore our priorities — all in one place, simply and transparently.

Our goal is to ensure every resident is heard, accountability stays strong, and you have a direct role in your ward's progress.

The platform is open — any registered resident can submit suggestions. Abusive or personal attacks are not published.`,
      },
      {
        slug: "panch-scope",
        titleHi: "वार्ड पंच क्या कर सकते हैं?",
        titleEn: "What can the ward panch do?",
        bodyHi: `वार्ड पंच स्थानीय स्तर पर कई मुद्दों पर काम कर सकते हैं — जैसे सड़क-नाली, स्ट्रीट लाइट, कूड़ा प्रबंधन, पेयजल और सामुदायिक सुविधाएँ।

कुछ बड़े मुद्दे (जैसे मुख्य सड़क, बड़े नाले, या नगर निगम स्तर की योजनाएँ) के लिए उच्च अधिकारियों या नगर निगम तक याचिका या प्रस्ताव भेजना पड़ सकता है। आपका वार्ड ऐसे मामलों को भी ट्रैक करने और आगे बढ़ाने में मदद करता है।

यदि आपको लगता है कि कोई समस्या वार्ड पंच की सीमा से बाहर है, तब भी उसे दर्ज करें — हम उचित मंच पर उठाने का प्रयास करेंगे।`,
        bodyEn: `The ward panch can work on many local matters — such as roads and drains, street lights, waste management, drinking water, and community facilities.

Some larger issues (main roads, major drains, or municipal-level schemes) may need petitions or proposals to higher authorities or the municipal corporation. Aapka Ward helps track and advance those cases too.

If you feel an issue is beyond the ward panch's scope, still report it — we will try to raise it on the appropriate forum.`,
      },
    ];

    for (const page of defaults) {
      const existing = await this.getPage(page.slug);
      if (!existing) await this.upsertPage(page);
    }
  }
}
