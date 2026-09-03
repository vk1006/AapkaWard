import "./load-env";
import { getContainer } from "../src/infrastructure/container";

async function seed() {
  const { content, platform, events } = getContainer();

  await platform.ensureDefaults();
  await content.ensureDefaultPages();

  const manifesto = await content.listManifesto(false);
  if (manifesto.length === 0) {
    await content.upsertManifesto({
      slug: "clean-water",
      theme: "water",
      sortOrder: 1,
      titleHi: "स्वच्छ पेयजल",
      titleEn: "Clean Drinking Water",
      bodyHi: "हर घर तक स्वच्छ पेयजल की व्यवस्था सुनिश्चित करेंगे।",
      bodyEn: "We will ensure clean drinking water reaches every household.",
      published: true,
    });
    await content.upsertManifesto({
      slug: "roads",
      theme: "infrastructure",
      sortOrder: 2,
      titleHi: "सड़क और नाली",
      titleEn: "Roads and Drainage",
      bodyHi: "टूटी सड़कों और जाम नालियों की मरम्मत प्राथमिकता पर।",
      bodyEn: "Repair of broken roads and clogged drains is a top priority.",
      published: true,
    });
  }

  const allEvents = await events.listAll();
  if (allEvents.length === 0) {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 7);
    await events.upsert({
      titleHi: "जनसंपर्क सभा",
      titleEn: "Public Meeting",
      bodyHi: "वार्ड निवासियों के साथ खुली बैठक।",
      bodyEn: "Open meeting with ward residents.",
      startsAt,
      placeText: "वार्ड कार्यालय के सामने",
      published: true,
    });
  }

  console.log("Seed completed.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
