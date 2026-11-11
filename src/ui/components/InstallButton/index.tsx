import { Download } from "lucide-preact";
import StyledButton from "src/ui/components/StyledButton";
import { t } from "src/ui/i18n";
import { InstallPrompt, installApp } from "src/ui/pwa";

import "./index.css";

export default function InstallButton() {
  if (!InstallPrompt.value) return null;

  return (
    <StyledButton className="install-button" title={t("pwa.install")} onClick={installApp}>
      <Download size={16} aria-hidden="true" />
      <span>{t("pwa.install")}</span>
    </StyledButton>
  );
}
