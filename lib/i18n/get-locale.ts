import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, locales, type Locale } from "./dictionary";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}
