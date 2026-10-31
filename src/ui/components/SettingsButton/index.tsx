import { PopupData } from "src/ui";
import { openPopup } from "src/ui/PopupStore";
import { Mode, ModeEnum, toggleMode } from "src/ui/ModeStore";
import { desktopUpdater, Update, type UpdateState } from "src/ui/UpdateStore";
import { Settings } from "lucide-preact";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import { useEffect, useRef } from "preact/hooks";
import StyledButton, { ButtonVariant } from "src/ui/components/StyledButton";

import "./index.css";
import { CurrentLang, LANGUAGES, t, type Lang } from "src/ui/i18n";

function getUpdateDescription(update: UpdateState) {
  if (!update.supported) return t("update.unsupported");

  switch (update.status) {
    case "checking":
      return t("update.checking");
    case "up-to-date":
      return t("update.upToDate");
    case "available":
      return update.canInstall ? t("update.downloading") : t("update.available");
    case "downloading":
      return t("update.downloadingPercent", { n: Math.round(update.progress) });
    case "downloaded":
      return t("update.downloaded");
    case "error":
      return t("update.error");
    default:
      return t("update.notChecked");
  }
}

function UpdateButton({ update }: { update: UpdateState }) {
  const updater = desktopUpdater;
  if (!updater) return null;

  if (update.status === "downloaded") {
    return (
      <StyledButton variant={ButtonVariant.Primary} onClick={() => updater.install()}>
        {t("settings.restartToUpdate")}
      </StyledButton>
    );
  }

  if (update.status === "available" && !update.canInstall) {
    return (
      <StyledButton variant={ButtonVariant.Primary} onClick={() => updater.openRelease()}>
        {t("common.download")}
      </StyledButton>
    );
  }

  const busy =
    update.status === "checking" ||
    update.status === "downloading" ||
    update.status === "available";

  return (
    <StyledButton disabled={!update.supported || busy} onClick={() => updater.check()}>
      {t("settings.checkUpdates")}
    </StyledButton>
  );
}

function UpdateSettings() {
  const update = Update.value;
  const updater = desktopUpdater;
  if (!update || !updater) return null;

  return (
    <section className="settings-section">
      <h2>{t("settings.updates")}</h2>

      <label className="settings-row">
        <div className="settings-row-text">
          <span className="settings-row-title">{t("settings.autoUpdate")}</span>
          <span className="settings-row-description">
            {update.canInstall ? t("settings.autoUpdateInstall") : t("settings.autoUpdateCheck")}
          </span>
        </div>
        <input
          type="checkbox"
          role="switch"
          className="settings-switch"
          checked={update.autoUpdate}
          disabled={!update.supported}
          onChange={(ev) => updater.setAutoUpdate(ev.currentTarget.checked)}
        />
      </label>

      <div className="settings-row static">
        <div className="settings-row-text">
          <span className="settings-row-title">{t("settings.softwareUpdate")}</span>
          <span className="settings-row-description" aria-live="polite">
            {getUpdateDescription(update)}
          </span>
        </div>
        <UpdateButton update={update} />
      </div>
    </section>
  );
}

function SettingsMenu() {
  const isAdvanced = Mode.value === ModeEnum.Advanced;

  return (
    <div className="settings-content">
      <h1>{t("settings.title")}</h1>

      <section className="settings-section">
        <h2>{t("settings.general")}</h2>

        <label className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-title">{t("language.label")}</span>
          </div>
          <select
            className="settings-select"
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

        <label className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-title">{t("settings.advanced")}</span>
            <span className="settings-row-description">{t("settings.advancedDesc")}</span>
          </div>
          <input
            type="checkbox"
            role="switch"
            className="settings-switch"
            checked={isAdvanced}
            onChange={toggleMode}
          />
        </label>
      </section>

      <UpdateSettings />
    </div>
  );
}

export default function SettingsButton() {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!btnRef.current) return;
    const instance = tippy(btnRef.current, {
      content: t("settings.title"),
      placement: "bottom",
      delay: [300, 0],
    });
    return () => instance.destroy();
  }, [CurrentLang.value]);

  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const onSettingsClick = () => {
    PopupData.value = {
      dismissible: true,
      buttonText: () => t("common.done"),
      className: "settings-popup",
      contents: <SettingsMenu />,
    };
    openPopup();
  };

  return (
    <StyledButton
      buttonRef={btnRef}
      variant={ButtonVariant.Icon}
      ariaLabel={t("settings.title")}
      onClick={onSettingsClick}
    >
      <Settings size={18} aria-hidden="true" />
    </StyledButton>
  );
}
