import "./index.css";

import { useState, useMemo, useCallback, useEffect, useRef } from "preact/hooks";
import mime from "mime";
import {
  ConversionOptions,
  goToUploadHome,
  SelectedFiles,
  type ConversionOption,
  type ConversionOptionsMap,
} from "src/main";
import { Mode, ModeEnum } from "src/ui/ModeStore";
import normalizeMimeType from "src/normalizeMimeType";
import { getExt } from "src/common/index.ts";
import type { FileData, FileFormat } from "src/FormatHandler";

import ConversionHeader from "src/ui/components/Conversion/ConversionHeader";
import FormatExplorer from "src/ui/components/Conversion/FormatExplorer";
import LoadingScreen from "src/ui/components/LoadingScreen";
import Footer from "src/ui/components/Footer";
import { ArrowLeft, ArrowRight, Plus } from "lucide-preact";
import { PopupData } from "src/ui/AppState";
import { closePopup, openPopup, popupOpen } from "src/ui/PopupStore";
import FileInfoBadge from "src/ui/components/FileInfo";
import { ConversionInProgress, CurrentPage, Pages } from "src/ui/AppState";
import { ProgressStore } from "src/ui/ProgressStore";
import StyledButton, { ButtonVariant } from "src/ui/components/StyledButton";
import ConversionResults, { downloadFile } from "src/ui/components/ConversionResults";
import { t } from "src/ui/i18n";
import { categoriesOf } from "src/ui/suggestions";
import { changeExt, stripExt } from "src/common/index.ts";

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

/**
 * Picks the input format for a file.
 * The exact extension + MIME match wins. In advanced mode, where every tool is listed separately,
 * the most capable tool for that format is picked.
 */
function detectInputOption(
  options: ConversionOptionsMap,
  file: File | undefined,
  simple: boolean,
): ConversionOption | null {
  if (!file) return null;
  const matching = getMatchingFromFormats(options, [file]);
  if (!matching.size) return null;
  const mimeCandidates = getMimeCandidatesForFile(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (!simple) {
    if (matching.size === 1) return matching.entries().next().value ?? null;
    // Several tools can read this file: start with the exact format match whose tool can
    // produce the most outputs (e.g. ImageMagick for PNG). The input pill lets the user change it.
    const outputCounts = new Map<string, number>();
    for (const [format, handler] of options) {
      if (format.to) outputCounts.set(handler.name, (outputCounts.get(handler.name) ?? 0) + 1);
    }
    let best: ConversionOption | null = null;
    for (const [format, handler] of matching) {
      if (ext !== format.extension || !mimeCandidates.includes(format.mime)) continue;
      if (!best || (outputCounts.get(handler.name) ?? 0) > (outputCounts.get(best[1].name) ?? 0))
        best = [format, handler];
    }
    return best;
  }

  const uniqueFormats = new Set<string>();
  for (const [format, handler] of matching) {
    uniqueFormats.add(`${format.mime}|${format.format}`);

    // chances are, this format is exactly what the user wants
    if (ext === format.extension && mimeCandidates.includes(format.mime)) {
      return [format, handler];
    }
  }
  if (uniqueFormats.size === 1) return matching.entries().next().value ?? null;

  return null;
}

/** Splits the selection into groups of the same kind of file (by extension), keeping order */
function groupFiles(files: File[]): File[][] {
  const groups = new Map<string, File[]>();
  for (const file of files) {
    const key = getExt(file.name).toLowerCase() || file.type || "?";
    const group = groups.get(key);
    if (group) group.push(file);
    else groups.set(key, [file]);
  }
  return [...groups.values()];
}

/** Makes output names unique, since different inputs (photo.png, photo.heic) can map to the same name */
function dedupeNames(files: FileData[]): FileData[] {
  const used = new Set<string>();
  return files.map((file) => {
    let name = file.name;
    const ext = getExt(name);
    for (let n = 1; used.has(name); n++) {
      name = ext ? changeExt(file.name, ext, `_${n}`) : `${stripExt(file.name)}_${n}`;
    }
    used.add(name);
    return name === file.name ? file : { ...file, name };
  });
}

interface ConversionJob {
  files: File[];
  option: ConversionOption | null;
}

function removeFile(key: string) {
  const { [key as keyof typeof SelectedFiles.value]: _, ...rest } = SelectedFiles.value;
  SelectedFiles.value = rest;
  if (Object.keys(rest).length === 0) CurrentPage.value = Pages.Upload;
}

function addFiles(fileList: FileList | null | undefined) {
  if (!fileList || fileList.length === 0) return;

  const files = [...Object.values(SelectedFiles.value), ...Array.from(fileList)];

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

  const autoSelectOption = useMemo<ConversionOption | null>(
    () => detectInputOption(allOptions, firstFile, Mode.value === ModeEnum.Simple),
    [allOptions, Mode.value, firstFile],
  );

  // Different kinds of files are converted group by group, each with its detected input format
  const groups = useMemo(() => groupFiles(files), [files]);
  const isMixed = groups.length > 1;
  const groupsKey = groups.map((group) => getExt(group[0].name).toLowerCase()).join("|");
  const mixedJobs = useMemo<ConversionJob[] | null>(
    () =>
      isMixed
        ? groups.map((group) => ({
            files: group,
            option: detectInputOption(allOptions, group[0], true),
          }))
        : null,
    [groups, isMixed, allOptions],
  );

  const [step, setStep] = useState<ConversionStep>(() => {
    if (autoSelectOption) return "select-to";
    return "select-from";
  });

  const [fromOption, setFromOption] = useState<ConversionOption | null>(autoSelectOption);
  const [showAll, setShowAll] = useState(files.length === 0);

  const [toOption, setToOption] = useState<ConversionOption | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [activeFrom, setActiveFrom] = useState<ConversionOption | null>(null);

  const suggestFor = useMemo(() => {
    if (mixedJobs) {
      const categories = mixedJobs.flatMap((job) =>
        job.option ? categoriesOf(job.option[0]) : [],
      );
      return { categories, exclude: [] };
    }
    if (!fromOption) return undefined;
    return { categories: categoriesOf(fromOption[0]), exclude: [fromOption[0].extension] };
  }, [mixedJobs, fromOption]);

  useEffect(() => {
    if (!firstFile || isConverting) return;

    if (isMixed) {
      setFromOption(null);
      setStep("select-to");
      setShowAll(false);
      return;
    }

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
  }, [firstFile, groupsKey]);

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
    // Mixed selections detect each group's input format automatically
    if (isMixed) return;
    setStep("select-from");
  };

  const handleFromToClickTo = () => {
    setStep("select-to");
  };

  const showResults = (outputs: FileData[], summary: string, failed: string[]) => {
    if (outputs.length === 1) downloadFile(outputs[0].bytes, outputs[0].name);
    PopupData.value = {
      contents: (
        <ConversionResults
          files={outputs}
          summary={summary}
          failed={failed}
          zipName={`converted-${toOption?.[0].extension ?? "files"}.zip`}
          onStartOver={() => {
            closePopup();
            previousSelection = null;
            goToUploadHome();
          }}
        />
      ),
      className: "results-popup",
      dismissible: true,
      buttonText: () => t("common.close"),
    };
    openPopup(() => actionRef.current);
  };

  const showFailure = (error: unknown) => {
    PopupData.value = error
      ? {
          title: t("conv.errorTitle"),
          text: t("conv.errorText", { error: String(error) }),
          dismissible: true,
          buttonText: t("common.ok"),
        }
      : {
          title: t("conv.failedTitle"),
          text: isAdvanced
            ? `${t("conv.failedText")} ${t("conv.failedAdvancedHint")}`
            : t("conv.failedText"),
          dismissible: true,
          buttonText: t("common.ok"),
        };
    openPopup(() => actionRef.current);
  };

  const handleConvert = async () => {
    if (!toOption || !firstFile) return;
    const jobs: ConversionJob[] = mixedJobs ?? (fromOption ? [{ files, option: fromOption }] : []);
    if (jobs.length === 0) return;

    setIsConverting(true);
    ConversionInProgress.value = true;
    setStep("converting");
    ProgressStore.reset();
    const abortController = ProgressStore.controller;

    const outputs: FileData[] = [];
    const failed: string[] = [];
    const paths: string[] = [];
    let lastError: unknown = null;

    try {
      for (const job of jobs) {
        const names = job.files.map((file) => file.name);
        if (!job.option) {
          failed.push(...names);
          continue;
        }
        setActiveFrom(job.option);

        const inputFileData = await Promise.all(
          job.files.map(async (file) => ({
            name: file.name,
            bytes: new Uint8Array(await file.arrayBuffer()),
          })),
        );

        // Already in the requested format, nothing to convert
        if (
          job.option[0].mime === toOption[0].mime &&
          job.option[0].format === toOption[0].format
        ) {
          outputs.push(...inputFileData);
          continue;
        }

        try {
          const output = await window.tryConvertByTraversing(
            inputFileData,
            { handler: job.option[1], format: job.option[0] },
            { handler: toOption[1], format: toOption[0] },
            abortController.signal,
          );
          if (!output) {
            failed.push(...names);
            continue;
          }
          outputs.push(...output.files);
          paths.push(output.path.map((c) => c.format.format).join(" → "));
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") throw e;
          console.error(e);
          lastError = e;
          failed.push(...names);
        }
      }

      if (outputs.length === 0) {
        showFailure(jobs.length === 1 ? lastError : null);
        return;
      }

      const summary =
        jobs.length === 1 && jobs[0].option && paths.length === 1
          ? t("conv.summary", {
              from: jobs[0].option[0].format.toUpperCase(),
              to: toOption[0].format.toUpperCase(),
              path: paths[0],
            })
          : t("conv.summaryMixed", { n: outputs.length, to: toOption[0].format.toUpperCase() });

      showResults(dedupeNames(outputs), summary, failed);
    } catch (e) {
      console.error(e);
      if (!(e instanceof Error && e.name === "AbortError")) showFailure(e);
      // Don't show an error popup for manual cancellation
    } finally {
      setIsConverting(false);
      setActiveFrom(null);
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
    step === "select-from" ? !!fromOption : (isMixed || !!fromOption) && !!toOption && !!firstFile;

  return (
    <div className="conversion-body">
      <ConversionHeader logoDisabled={step === "converting"} />

      <main className="conversion-main">
        {step === "converting" ? (
          <LoadingScreen
            fileName={firstFile?.name || "file"}
            fileSize={firstFile?.size}
            from={(activeFrom ?? fromOption)?.[0]}
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
            suggestFor={suggestFor}
            fromLabel={isMixed ? t("explorer.mixedInput", { n: groups.length }) : undefined}
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
          {step === "select-to" && !isMixed && (
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
