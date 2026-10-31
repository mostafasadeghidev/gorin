import { useState } from "preact/hooks";
import { Download, FileArchive, RotateCcw } from "lucide-preact";
import type { FileData } from "src/FormatHandler";

import "./index.css";
import { t } from "src/ui/i18n";

export function downloadFile(bytes: Uint8Array | Blob, name: string) {
  const blob =
    bytes instanceof Blob
      ? bytes
      : new Blob([bytes as BlobPart], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface ConversionResultsProps {
  files: FileData[];
  summary: string;
  zipName: string;
  /** Names of input files that couldn't be converted */
  failed?: string[];
  /** Clears the selection and goes back to the upload page */
  onStartOver?: () => void;
}

export default function ConversionResults({
  files,
  summary,
  zipName,
  failed = [],
  onStartOver,
}: ConversionResultsProps) {
  const [zipping, setZipping] = useState(false);

  const downloadZip = async () => {
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const file of files) zip.file(file.name, file.bytes);
      downloadFile(await zip.generateAsync({ type: "blob" }), zipName);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="conversion-results">
      <h1>{t("conv.complete")}</h1>
      <p>{summary}</p>

      {failed.length > 0 && (
        <p className="results-failed">{t("results.failed", { files: failed.join(", ") })}</p>
      )}

      {files.length > 1 && (
        <button className="results-zip" onClick={downloadZip} disabled={zipping}>
          <FileArchive size={16} />
          {zipping ? t("results.zipping") : t("results.zip", { n: files.length })}
        </button>
      )}

      <ul className="results-list">
        {files.map((file) => (
          <li key={file.name}>
            <bdi className="results-name" title={file.name}>
              {file.name}
            </bdi>
            <span className="results-size">{formatSize(file.bytes.length)}</span>
            <button
              className="results-download"
              onClick={() => downloadFile(file.bytes, file.name)}
              title={t("results.download", { name: file.name })}
              aria-label={t("results.download", { name: file.name })}
            >
              <Download size={16} />
            </button>
          </li>
        ))}
      </ul>

      {onStartOver && (
        <button className="results-start-over" onClick={onStartOver}>
          <RotateCcw size={15} />
          {t("results.startOver")}
        </button>
      )}
    </div>
  );
}
