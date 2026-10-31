import { signal } from "@preact/signals";

import type { PopupDataContainer } from "./PopupStore";
import { t, type MessageKey } from "./i18n";

export const enum Pages {
  Upload = "uploadPage",
  Conversion = "conversionPage",
}

export const CurrentPage = signal<Pages>(Pages.Upload);

export const PopupData = signal<PopupDataContainer>({
  title: t("loading.toolsTitle"),
  text: t("loading.toolsText"),
  dismissible: false,
  buttonText: t("loading.toolsIgnore"),
});

export const LoadingToolsText = signal<MessageKey | undefined>("loading.formats");
export const ConversionInProgress = signal(false);
