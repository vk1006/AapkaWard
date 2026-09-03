import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cardClass } from "@/components/ui";

export async function IssuesDisabled() {
  const t = await getTranslations("issues");

  return (
    <div className={`text-center ${cardClass}`}>
      <h1 className="text-xl font-bold text-orange-800 dark:text-orange-300">{t("title")}</h1>
      <p className="mt-3 text-gray-600 dark:text-stone-400">{t("disabled")}</p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm text-orange-700 hover:underline dark:text-orange-400"
      >
        ← {t("backHome")}
      </Link>
    </div>
  );
}
