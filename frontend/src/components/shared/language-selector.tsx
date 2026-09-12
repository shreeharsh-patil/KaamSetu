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
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/types";

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
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selected = (currentLocale || locale) as SupportedLocale;

  const activeLang =
    SUPPORTED_LOCALES.find((l) => l.code === selected) || SUPPORTED_LOCALES[0]!;

  const handleSelect = (code: SupportedLocale) => {
    if (onSelectLocale) {
      onSelectLocale(code);
    } else {
      setLocale(code);
    }
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 sm:px-3 h-9 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-2xs whitespace-nowrap shrink-0",
          className
        )}
        aria-label={`Language selector. Current language: ${activeLang.nativeName}`}
      >
        <Languages className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="font-semibold text-xs whitespace-nowrap hidden xs:inline">{activeLang.nativeName}</span>
        <span className="font-semibold text-xs whitespace-nowrap xs:hidden">{activeLang.code.toUpperCase()}</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <span>{t("language.selectTitle", "Select Preferred Language")}</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {t("language.selectSub", "Choose your preferred language for all screens and voice workflows")}
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-3">
            {SUPPORTED_LOCALES.map((lang) => {
              const isCurrent = lang.code === selected;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3 text-left transition-all min-h-touch",
                    isCurrent
                      ? "border-primary bg-primary/10 font-semibold text-primary shadow-xs ring-1 ring-primary/30"
                      : "hover:bg-muted/80 text-foreground border-border/60"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{lang.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
