"use client";

import { useState } from "react";
import { Languages, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useTranslation } from "@/lib/i18n/i18n-context";
import type { SupportedLocale } from "@/lib/i18n/types";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

export interface LanguageSelectorProps {
  currentLocale?: string;
  onSelectLocale?: (locale: string) => void;
  className?: string;
}

export function LanguageSelector({
  currentLocale,
  onSelectLocale,
  className,
}: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selected = currentLocale || locale;

  const activeLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selected) || SUPPORTED_LANGUAGES[0]!;

  const handleSelect = (code: string) => {
    if (onSelectLocale) {
      onSelectLocale(code);
    } else {
      setLocale(code as SupportedLocale);
    }
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors min-h-touch",
          className
        )}
        aria-label={`Language selector. Current language: ${activeLang.nativeName}`}
      >
        <Languages className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{activeLang.nativeName}</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <span>Select Preferred Language</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-2 py-3">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isCurrent = lang.code === selected;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-left transition-colors min-h-touch",
                    isCurrent
                      ? "border-primary bg-primary/5 font-semibold text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
