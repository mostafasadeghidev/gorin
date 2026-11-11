import { PopupData } from "src/ui";
import { popupOpen } from "src/ui/PopupStore";
import { HelpCircle } from "lucide-preact";
import tippy from "tippy.js";
import { useEffect, useRef } from "preact/hooks";
import StyledButton, { ButtonVariant } from "src/ui/components/StyledButton";
import { CurrentLang, t } from "src/ui/i18n";
import { AUTHOR_URL } from "src/ui/components/Footer";

function HelpContent() {
  return (
    <div className="help-content">
      <h1>Gorin</h1>
      <p className="help-subtitle">{t("help.subtitle")}</p>

      <div className="help-section">
        <h2>{t("help.whyTitle")}</h2>
        <p>{t("help.why1")}</p>
        <p>{t("help.why2")}</p>
      </div>

      <div className="help-section">
        <h2>{t("help.howTitle")}</h2>
        <ol>
          <li>{t("help.step1")}</li>
          <li>{t("help.step2")}</li>
          <li>{t("help.step3")}</li>
          <li>{t("help.step4")}</li>
        </ol>
      </div>

      <div className="help-section">
        <h2>{t("help.advancedTitle")}</h2>
        <p>{t("help.advancedText")}</p>
      </div>

      <p className="help-credit">
        {t("footer.madeBy")}{" "}
        <a href={AUTHOR_URL} target="_blank" rel="noopener">
          {t("author.name")}
        </a>
        {" · "}
        <a href={AUTHOR_URL} target="_blank" rel="noopener">
          <bdi dir="ltr">github.com/mostafasadeghidev</bdi>
        </a>
      </p>
    </div>
  );
}

export default function HelpButton() {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!btnRef.current) return;
    const instance = tippy(btnRef.current, {
      content: t("help.label"),
      placement: "bottom",
      delay: [300, 0],
    });
    return () => instance.destroy();
  }, [CurrentLang.value]);

  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const onHelpClick = () => {
    PopupData.value = {
      dismissible: true,
      buttonText: t("help.gotIt"),
      contents: <HelpContent />,
    };
    popupOpen.value = true;
  };

  return (
    <StyledButton
      buttonRef={btnRef}
      variant={ButtonVariant.Icon}
      ariaLabel={t("help.label")}
      onClick={onHelpClick}
    >
      <HelpCircle size={18} aria-hidden="true" />
    </StyledButton>
  );
}
