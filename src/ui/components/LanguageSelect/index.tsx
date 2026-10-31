import { Languages } from "lucide-preact";
import { CurrentLang, LANGUAGES, t, type Lang } from "src/ui/i18n";

import "./index.css";

export default function LanguageSelect() {
  const current = LANGUAGES.find((lang) => lang.id === CurrentLang.value) ?? LANGUAGES[0];

  return (
    <label className="language-select styled-button" title={t("language.label")}>
      <Languages size={16} aria-hidden="true" />
      <span className="language-select-short" aria-hidden="true">
        {current.short}
      </span>
      <select
        aria-label={t("language.label")}
        value={CurrentLang.value}
        onChange={(ev) => (CurrentLang.value = ev.currentTarget.value as Lang)}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>
    </label>
  );
}
