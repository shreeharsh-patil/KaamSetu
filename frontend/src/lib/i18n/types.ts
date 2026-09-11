export type SupportedLocale = "en" | "hi" | "mr" | "kok";

export interface LocaleMetadata {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleMetadata[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी", flag: "🇮🇳" },
];
