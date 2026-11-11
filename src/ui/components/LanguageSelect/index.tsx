import { useEffect, useRef, useState } from "preact/hooks";
import { Check, ChevronDown, Languages } from "lucide-preact";
import { CurrentLang, LANGUAGES, t, type Lang } from "src/ui/i18n";

import "./index.css";

interface LanguageSelectProps {
  /** Which way the menu opens; "up" for buttons near the bottom of a clipped container */
  direction?: "up" | "down";
}

export default function LanguageSelect({ direction = "down" }: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = LANGUAGES.find((lang) => lang.id === CurrentLang.value) ?? LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (ev: PointerEvent) => {
      if (!rootRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus to the selected language when the menu opens
  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
  }, [open]);

  const choose = (lang: Lang) => {
    CurrentLang.value = lang;
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKeyDown = (ev: KeyboardEvent) => {
    const items = [
      ...(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []),
    ];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (ev.key === "Escape") {
      ev.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      const step = ev.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (ev.key === "Home" || ev.key === "End") {
      ev.preventDefault();
      items[ev.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (ev.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="language-select" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="language-select-button styled-button"
        title={t("language.label")}
        aria-label={`${t("language.label")}: ${current.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(ev) => {
          if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
            ev.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Languages size={16} aria-hidden="true" />
        <span className="language-select-short" aria-hidden="true">
          {current.short}
        </span>
        <ChevronDown size={14} className="language-select-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div
          className={`language-select-menu language-select-menu-${direction}`}
          role="menu"
          aria-label={t("language.label")}
          onKeyDown={onMenuKeyDown}
        >
          {LANGUAGES.map((lang) => {
            const selected = lang.id === CurrentLang.value;
            return (
              <button
                key={lang.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className="language-select-item"
                lang={lang.id}
                onClick={() => choose(lang.id)}
              >
                <span className="language-select-code" aria-hidden="true">
                  {lang.short}
                </span>
                <span className="language-select-name">{lang.name}</span>
                <Check size={15} className="language-select-check" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
