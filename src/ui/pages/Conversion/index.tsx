import "./index.css";

import { useState, useMemo, useCallback, useEffect, useRef } from "preact/hooks";
import mime from "mime";
import {
  ConversionOptions,
  SelectedFiles,
  type ConversionOption,
  type ConversionOptionsMap,
} from "src/main";
import { Mode, ModeEnum } from "src/ui/ModeStore";
import normalizeMimeType from "src/normalizeMimeType";
import { getExt } from "src/common/index.ts";
import type { FileFormat } from "src/FormatHandler";

import ConversionHeader from "src/ui/components/Conversion/ConversionHeader";
import FormatExplorer from "src/ui/components/Conversion/FormatExplorer";
import LoadingScreen from "src/ui/components/LoadingScreen";
import Footer from "src/ui/components/Footer";
import { ArrowLeft, ArrowRight, Plus } from "lucide-preact";
import { PopupData } from "src/ui/AppState";
import { openPopup, popupOpen } from "src/ui/PopupStore";
import FileInfoBadge from "src/ui/components/FileInfo";
import { ConversionInProgress, CurrentPage, Pages } from "src/ui/AppState";
import { ProgressStore } from "src/ui/ProgressStore";
import StyledButton, { ButtonVariant } from "src/ui/components/StyledButton";
import ConversionResults, { downloadFile } from "src/ui/components/ConversionResults";
import { t } from "src/ui/i18n";

let previousSelection: {
  fileExt: string;
  from: ConversionOption;
  to: ConversionOption;
} | null = null;

type ConversionStep = "select-from" | "select-to" | "converting";

function countAvailableFormats(
  options: ConversionOptionsMap,
  direction: "from" | "to",
  advancedMode: boolean,
): number {
  const seen = new Set<string>();
  let count = 0;

  for (const [format] of options) {
    if (direction === "from" && !format.from) continue;
    if (direction === "to" && !format.to) continue;

    if (advancedMode) {
      count += 1;
      continue;
    }

    const dedupeKey = `${format.mime}|${format.format}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    count += 1;
  }

  return count;
}

function getConversionOptions(): ConversionOptionsMap {
  if (ConversionOptions.size) return ConversionOptions;
  throw new Error("Can't build format list!", { cause: "UI got empty global format list" });
}

function expandVideoContainerMimes(candidates: string[]): string[] {
  const out = new Set(candidates);
  for (const c of candidates) {
    if (c === "video/mp4" || c === "video/quicktime") {
      out.add("video/mp4");
      out.add("video/quicktime");
    }
  }
  return [...out];
}

function getMimeCandidatesForFile(file: File): string[] {
  const set = new Set<string>();
  const raw = file.type?.trim();
  if (raw) set.add(normalizeMimeType(raw));
  const fromPath = mime.getType(file.name);
  if (fromPath) set.add(normalizeMimeType(fromPath));
  const extOnly = file.name.split(".").pop()?.toLowerCase();
  if (extOnly) {
    const fromExt = mime.getType(extOnly);
    if (fromExt) set.add(normalizeMimeType(fromExt));
  }
  return expandVideoContainerMimes([...set]);
}

function formatMatchesUploadedFile(
  format: FileFormat,
  ext: string,
  mimeCandidates: string[],
): boolean {
  if (mimeCandidates.some((m) => m === format.mime)) return true;
  if (!ext) return false;
  const e = ext.toLowerCase();
  const fex = format.extension.toLowerCase();
  const fmt = format.format.toLowerCase();
  const intr = format.internal.toLowerCase();
  return (
    fex === e || fex.includes(e) || fmt === e || fmt.includes(e) || intr === e || intr.includes(e)
  );
}

function getMatchingFromFormats(
  options: ConversionOptionsMap,
  files: File[],
): ConversionOptionsMap {
  if (files.length === 0) return new Map();

  const file = files[0];
  const mimeCandidates = getMimeCandidatesForFile(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const matched: ConversionOptionsMap = new Map();

  for (const [format, handler] of options) {
    if (!format.from) continue;
    if (formatMatchesUploadedFile(format, ext, mimeCandidates)) {
      matched.set(format, handler);
    }
  }

  return matched;
}

function removeFile(key: string) {
  const { [key as keyof typeof SelectedFiles.value]: _, ...rest } = SelectedFiles.value;
  SelectedFiles.value = rest;
  if (Object.keys(rest).length === 0) CurrentPage.value = Pages.Upload;
}

function addFiles(fileList: FileList | null | undefined) {
  if (!fileList || fileList.length === 0) return;

  const files = [...Object.values(SelectedFiles.value), ...Array.from(fileList)];

  const sameMime = files.every((file) => file.type === files[0].type);
  if (!sameMime) {
    PopupData.value = {
      title: t("invalid.title"),
      text: t("invalid.text"),
      dismissible: true,
      buttonText: t("common.ok"),
    };
    openPopup();
    return;
  }

  SelectedFiles.value = Object.fromEntries(
    files.map((file) => [`${file.name}-${file.lastModified}`, file]),
  );
}

export default function Conversion() {
  const actionRef = useRef<HTMLButtonElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);
  const actionBarRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const previousStep = useRef<ConversionStep | null>(null);
  const allOptions = getConversionOptions();
  const files = useMemo(() => Object.values(SelectedFiles.value), [SelectedFiles.value]);
  const firstFile = files[0];
  const isAdvanced = Mode.value === ModeEnum.Advanced;
  const fileExt = firstFile ? getExt(firstFile.name).toLowerCase() : null;

  const matchingFrom = useMemo(
    () => getMatchingFromFormats(allOptions, files),
    [allOptions, files],
  );

  const matchingFromSet = useMemo(() => new Set([...matchingFrom].map(([f]) => f)), [matchingFrom]);

  const autoSelectOption = useMemo<ConversionOption | null>(() => {
    if (!matchingFrom.size) return null;
    const isSimple = Mode.value === ModeEnum.Simple;
    if (!isSimple) {
      if (matchingFrom.size === 1) return matchingFrom.entries().next().value ?? null;
      else return null;
    }

    const mimeCandidates = getMimeCandidatesForFile(firstFile);
    const ext = firstFile.name.split(".").pop()?.toLowerCase() || "";

    const uniqueFormats = new Set<string>();
    for (const [format, handler] of matchingFrom) {
      uniqueFormats.add(`${format.mime}|${format.format}`);

      // chances are, this format is exactly what the user wants
      if (ext === format.extension && mimeCandidates.includes(format.mime)) {
        return [format, handler];
      }
    }
    if (uniqueFormats.size === 1) return matchingFrom.entries().next().value ?? null;

    return null;
  }, [matchingFrom, Mode.value, firstFile]);

  const [step, setStep] = useState<ConversionStep>(() => {
    if (autoSelectOption) return "select-to";
    return "select-from";
  });

  const [fromOption, setFromOption] = useState<ConversionOption | null>(autoSelectOption);
  const [showAll, setShowAll] = useState(files.length === 0);

  const [toOption, setToOption] = useState<ConversionOption | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (!firstFile || isConverting) return;

    const remembered = previousSelection;
    const sameInput = remembered && remembered.fileExt === fileExt;

    if (sameInput) {
      setFromOption(remembered.from);
      setToOption(remembered.to);
      setStep("select-to");
    } else if (autoSelectOption) {
      setFromOption(autoSelectOption);
      setToOption(null);
      setStep("select-to");
    } else {
      setFromOption(null);
      setToOption(null);
      setStep("select-from");
    }

    if (!sameInput) previousSelection = null;
    setShowAll(false);
  }, [firstFile]);

  useEffect(() => {
    if (fileExt && fromOption && toOption) {
      previousSelection = { fileExt, from: fromOption, to: toOption };
    }
  }, [fromOption, toOption]);

  useEffect(() => {
    if (previousStep.current === "converting" && step !== "converting" && !popupOpen.peek()) {
      actionRef.current?.focus();
    }
    previousStep.current = step;
  }, [step]);

  const handleFromSelect = useCallback((option: ConversionOption | null) => {
    setFromOption(option);
  }, []);

  const handleToSelect = useCallback((option: ConversionOption | null) => {
    setToOption(option);
  }, []);

  const handleNext = () => {
    if (step === "select-from" && fromOption) {
      setStep("select-to");
    }
  };

  const handleBack = () => {
    if (step === "select-to") {
      setStep("select-from");
    }
  };

  const handleFromToClickFrom = () => {
    setStep("select-from");
  };

  const handleFromToClickTo = () => {
    setStep("select-to");
  };

  const handleConvert = async () => {
    if (!fromOption || !toOption || !firstFile) return;

    setIsConverting(true);
    ConversionInProgress.value = true;
    setStep("converting");
    ProgressStore.reset();
    const abortController = ProgressStore.controller;

    try {
      const inputFileData = [];
      for (const f of files) {
        const buf = await f.arrayBuffer();
        const bytes = new Uint8Array(buf);

        if (
          fromOption[0].mime === toOption[0].mime &&
          fromOption[0].format === toOption[0].format
        ) {
          downloadFile(bytes, f.name);
          continue;
        }
        inputFileData.push({ name: f.name, bytes });
      }

      if (inputFileData.length === 0) {
        setIsConverting(false);
        setStep("select-to");
        return;
      }

      const fromNode = { handler: fromOption[1], format: fromOption[0] };
      const toNode = { handler: toOption[1], format: toOption[0] };

      const output = await window.tryConvertByTraversing(
        inputFileData,
        fromNode,
        toNode,
        abortController.signal,
      );

      if (!output) {
        setIsConverting(false);
        setStep("select-to");
        PopupData.value = {
          title: t("conv.failedTitle"),
          text: isAdvanced
            ? `${t("conv.failedText")} ${t("conv.failedAdvancedHint")}`
            : t("conv.failedText"),
          dismissible: true,
          buttonText: t("common.ok"),
        };
        openPopup(() => actionRef.current);
        return;
      }

      const summary = t("conv.summary", {
        from: fromOption[0].format.toUpperCase(),
        to: toOption[0].format.toUpperCase(),
        path: output.path.map((c) => c.format.format).join(" → "),
      });

      if (output.files.length === 1) {
        const [file] = output.files;
        downloadFile(file.bytes, file.name);
        PopupData.value = {
          title: t("conv.complete"),
          text: summary,
          dismissible: true,
          buttonText: t("common.ok"),
        };
      } else {
        PopupData.value = {
          contents: (
            <ConversionResults
              files={output.files}
              summary={summary}
              zipName={`converted-${toOption[0].extension}.zip`}
            />
          ),
          className: "results-popup",
          dismissible: true,
          buttonText: t("common.close"),
        };
      }
      openPopup(() => actionRef.current);
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.name === "AbortError") {
        // Don't show an error popup for manual cancellation
      } else {
        PopupData.value = {
          title: t("conv.errorTitle"),
          text: t("conv.errorText", { error: String(e) }),
          dismissible: true,
          buttonText: t("common.ok"),
        };
        openPopup(() => actionRef.current);
      }
    } finally {
      setIsConverting(false);
      ConversionInProgress.value = false;
      setStep("select-to");
    }
  };

  const addFileRef = useRef<HTMLInputElement>(null);

  const handleAddClick = (ev: MouseEvent) => {
    ev.preventDefault();
    addFileRef.current?.click();
  };

  const handleAddChange = () => {
    addFiles(addFileRef.current?.files);
  };

  const canProceed =
    step === "select-from" ? !!fromOption : !!fromOption && !!toOption && !!firstFile;

  return (
    <div className="conversion-body">
      <ConversionHeader logoDisabled={step === "converting"} />

      <main className="conversion-main">
        {step === "converting" ? (
          <LoadingScreen
            fileName={firstFile?.name || "file"}
            fileSize={firstFile?.size}
            from={fromOption?.[0]}
            to={toOption?.[0]}
          />
        ) : (
          <FormatExplorer
            searchScopeRef={actionBarRef}
            conversionOptions={allOptions}
            matchingFrom={matchingFromSet}
            onBack={handleBack}
            onAdvance={(option) => {
              if (step === "select-from") {
                setFromOption(option);
                setStep("select-to");
              } else {
                setToOption(option);
                requestAnimationFrame(() => actionRef.current?.focus());
              }
            }}
            onSelect={step === "select-from" ? handleFromSelect : handleToSelect}
            direction={step === "select-from" ? "from" : "to"}
            fromOption={fromOption}
            toOption={toOption}
            fromCount={countAvailableFormats(
              showAll ? allOptions : matchingFrom,
              "from",
              isAdvanced,
            )}
            toCount={countAvailableFormats(allOptions, "to", isAdvanced)}
            onClickFrom={handleFromToClickFrom}
            onClickTo={handleFromToClickTo}
            showAll={showAll}
            onShowAll={() => setShowAll(true)}
          />
        )}
      </main>

      {step !== "converting" && (
        <div className="conversion-action-bar" ref={actionBarRef}>
          <div className="conversion-action-files" ref={filesRef}>
            {Object.entries(SelectedFiles.value).map(([key, file]) => (
              <FileInfoBadge
                key={key}
                fileName={file.name}
                fileSize={file.size}
                extension={file.name.split(".").pop()}
                mimeType={file.type}
                onRemove={() => {
                  // Badges render in SelectedFiles order, so the key's index matches the DOM.
                  const buttons = [
                    ...(filesRef.current?.querySelectorAll<HTMLButtonElement>(
                      ".file-info-remove",
                    ) ?? []),
                  ];
                  const index = Object.keys(SelectedFiles.value).indexOf(key);
                  const next = buttons[index + 1] ?? buttons[index - 1];
                  removeFile(key);
                  requestAnimationFrame(() => {
                    if (next?.isConnected) next.focus();
                    else addButtonRef.current?.focus();
                  });
                }}
              />
            ))}
            <button
              ref={addButtonRef}
              type="button"
              className="file-info-badge file-info-add"
              onClick={handleAddClick}
              aria-label={t("conv.addFiles")}
            >
              <Plus size={16} />
            </button>
            <input ref={addFileRef} type="file" multiple hidden onChange={handleAddChange} />
          </div>
          {step === "select-to" && (
            <StyledButton onClick={handleBack}>
              <ArrowLeft size={16} className="dir-flip" />
              {t("common.back")}
            </StyledButton>
          )}
          <StyledButton
            buttonRef={actionRef}
            className="conversion-primary-action"
            variant={ButtonVariant.Primary}
            disabled={!canProceed}
            onClick={step === "select-from" ? handleNext : handleConvert}
          >
            {step === "select-from" ? t("common.next") : t("common.convert")}
            {step === "select-from" && <ArrowRight size={16} className="dir-flip" />}
          </StyledButton>
        </div>
      )}

      <Footer />
    </div>
  );
}
