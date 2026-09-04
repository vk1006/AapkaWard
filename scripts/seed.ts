import "./load-env";
import { getContainer } from "../src/infrastructure/container";

const MANIFESTO_SEED = [
  {
    slug: "clean-water",
    theme: "water",
    sortOrder: 1,
    titleHi: "स्वच्छ पेयजल",
    titleEn: "Clean Drinking Water",
    bodyHi:
      "हर घर और सार्वजनिक स्थान तक नियमित, स्वच्छ पेयजल की व्यवस्था। टूटे नलों, लीकेज और पानी की कमी की शिकायतों पर त्वरित कार्रवाई।",
    bodyEn:
      "Reliable, clean drinking water for every home and public point. Quick action on broken taps, leaks, and water shortages.",
    published: true,
  },
  {
    slug: "roads-drainage",
    theme: "infrastructure",
    sortOrder: 2,
    titleHi: "सड़क, गड्ढे और नाली",
    titleEn: "Roads, Potholes & Drains",
    bodyHi:
      "टूटी सड़कों और जाम नालियों की मरम्मत प्राथमिकता पर। बारिश में जलभराव कम करने के लिए नालियों की नियमित सफाई और निगरानी।",
    bodyEn:
      "Repair broken roads and clogged drains as a top priority. Regular drain cleaning and monitoring to reduce waterlogging during rains.",
    published: true,
  },
  {
    slug: "street-lights",
    theme: "safety",
    sortOrder: 3,
    titleHi: "स्ट्रीट लाइट और सुरक्षा",
    titleEn: "Street Lights & Safety",
    bodyHi:
      "अंधेरे गलियों में स्ट्रीट लाइट लगाना और खराब बल्ब की मरम्मत। महिलाओं, बुजुर्गों और बच्चों के लिए सुरक्षित रास्ते।",
    bodyEn:
      "Install street lights in dark lanes and fix broken bulbs. Safer routes for women, elders, and children.",
    published: true,
  },
  {
    slug: "waste-management",
    theme: "sanitation",
    sortOrder: 4,
    titleHi: "कूड़ा प्रबंधन",
    titleEn: "Waste Management",
    bodyHi:
      "नियमित कूड़ा उठाने की व्यवस्था, डंपिंग स्पॉट हटाना और स्वच्छता के लिए जागरूकता। पार्क और सार्वजनिक स्थानों की सफाई।",
    bodyEn:
      "Regular waste collection, removing dumping spots, and cleanliness awareness. Keeping parks and public spaces clean.",
    published: true,
  },
  {
    slug: "transparency",
    theme: "governance",
    sortOrder: 5,
    titleHi: "पारदर्शिता और जवाबदेही",
    titleEn: "Transparency & Accountability",
    bodyHi:
      "आपकी शिकायत और सुझावों पर सार्वजनिक अपडेट। कार्यक्रमों की जानकारी समय पर साझा करना और निर्णयों में जनभागीदारी।",
    bodyEn:
      "Public updates on your complaints and suggestions. Timely sharing of event information and resident participation in decisions.",
    published: true,
  },
  {
    slug: "youth-jobs",
    theme: "employment",
    sortOrder: 6,
    titleHi: "युवा और रोज़गार",
    titleEn: "Youth & Employment",
    bodyHi:
      "स्थानीय युवाओं के लिए कौशल विकास और रोज़गार के अवसर जोड़ने में मदद। वार्ड स्तर पर प्रशिक्षण और मार्गदर्शन कार्यक्रम।",
    bodyEn:
      "Help connect local youth with skill development and job opportunities. Ward-level training and guidance programmes.",
    published: true,
  },
] as const;

async function seed() {
  const { content, platform, events } = getContainer();

  await platform.ensureDefaults();
  await content.ensureDefaultPages();

  const manifesto = await content.listManifesto(false);
  if (manifesto.length === 0) {
    for (const item of MANIFESTO_SEED) {
      await content.upsertManifesto(item);
    }
  }

  const allEvents = await events.listAll();
  if (allEvents.length === 0) {
    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 7);
    await events.upsert({
      titleHi: "आपका वार्ड — जनसंपर्क सभा",
      titleEn: "Aapka Ward — Public Meeting",
      bodyHi: "वार्ड निवासियों के साथ खुली बैठक। अपनी समस्याएँ और सुझाव सीधे साझा करें।",
      bodyEn: "Open meeting with ward residents. Share your issues and suggestions directly.",
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
