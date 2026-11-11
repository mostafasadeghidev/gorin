import useFirstTabTarget from "src/ui/scripts/useFirstTabTarget";
import { useEffect, useRef } from "preact/hooks";
import { CurrentPage, LoadingToolsText, Pages } from "src/ui/AppState";
import { goToUploadHome, SelectedFiles } from "src/main";
import { Files, Layers, LockKeyhole, Sparkles, Upload } from "lucide-preact";
import tippy from "tippy.js";
import { CurrentLang, t } from "src/ui/i18n";
import InstallButton from "src/ui/components/InstallButton";
import LanguageSelect from "src/ui/components/LanguageSelect";

import Logo from "src/ui/components/Logo";
import HelpButton from "src/ui/components/HelpButton";
import SettingsButton from "src/ui/components/SettingsButton";
import Footer from "src/ui/components/Footer";
import StyledButton, { ButtonVariant } from "src/ui/components/StyledButton";

import "./index.css";

export default function UploadPage() {
  const uploadRef = useRef<HTMLDivElement>(null);
  useFirstTabTarget(uploadRef);
  const fileRef = useRef<HTMLInputElement>(null);
  const formatsRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!formatsRef.current) return;
    const instance = tippy(formatsRef.current, {
      content: t("upload.viewFormats"),
      placement: "bottom",
      delay: [300, 0],
    });
    return () => instance.destroy();
  }, [CurrentLang.value]);

  const handleClick = (ev: MouseEvent) => {
    ev.preventDefault();
    if (!formatsReady) return;
    fileRef.current?.click();
  };

  const formatsReady = LoadingToolsText.value === undefined;

  const processFiles = (fileList: FileList | null | undefined) => {
    if (!fileList || fileList.length === 0) return;
    if (!formatsReady) return;

    const files = Array.from(fileList);

    SelectedFiles.value = Object.fromEntries(
      files.map((file) => [`${file.name}-${file.lastModified}`, file]),
    );
    CurrentPage.value = Pages.Conversion;
  };

  const handleChange = () => {
    processFiles(fileRef.current?.files);
  };

  const handlePaste = (event: ClipboardEvent) => {
    processFiles(event.clipboardData?.files);
  };

  const handleLogoClick = (event: MouseEvent) => {
    (event.currentTarget as HTMLButtonElement)
      .querySelector(".logo-glyph")
      ?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-720deg)" }], {
        duration: 1000,
        easing: "cubic-bezier(0.33, 1, 0.68, 1)",
      });
    goToUploadHome();
    if (fileRef.current) fileRef.current.value = "";
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [formatsReady]);

  return (
    <div className="upload-page">
      <div className="upload-card">
        <div className="upload-card-header">
          <Logo showName={true} size={36} onClick={handleLogoClick} />
          <p className="upload-tagline">{t("app.tagline")}</p>
        </div>

        <div
          ref={uploadRef}
          aria-label={t("upload.select")}
          aria-disabled={!formatsReady}
          className={`upload-dropzone ${!formatsReady ? "upload-dropzone--pending" : ""}`}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!formatsReady) return;
              fileRef.current?.click();
            }
          }}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            name="uploadFile"
            id="uploadFile"
            onClick={(ev) => ev.stopPropagation()}
            tabIndex={-1}
            disabled={!formatsReady}
            onChange={handleChange}
          />
          <div className="upload-icon-wrap">
            <Upload />
          </div>
          <span className="upload-cta">
            {t(window.matchMedia("(pointer: coarse)").matches ? "upload.tap" : "upload.click")}
          </span>
          <span className="upload-hint">
            {window.matchMedia("(pointer: coarse)").matches ? "" : t("upload.drag")}
          </span>
        </div>

        <ul className="upload-features">
          <li>
            <LockKeyhole size={15} aria-hidden="true" />
            {t("feature.private")}
          </li>
          <li>
            <Layers size={15} aria-hidden="true" />
            {t("feature.formats")}
          </li>
          <li>
            <Sparkles size={15} aria-hidden="true" />
            {t("feature.free")}
          </li>
        </ul>

        <div className="upload-card-actions">
          <InstallButton />
          <LanguageSelect direction="up" />
          <SettingsButton />
          <HelpButton />
          <StyledButton
            buttonRef={formatsRef}
            variant={ButtonVariant.Icon}
            ariaLabel={t("upload.viewFormats")}
            onClick={() => {
              if (!formatsReady) return;
              CurrentPage.value = Pages.Conversion;
            }}
            disabled={!formatsReady}
          >
            <Files size={18} aria-hidden="true" />
          </StyledButton>
        </div>
      </div>

      <Footer loadingText={LoadingToolsText.value} />
    </div>
  );
}
