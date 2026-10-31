import { ArrowRight } from "lucide-preact";
import type { ConversionOption } from "src/main";
import FileIcon from "src/ui/components/FileIcon";
import "./index.css";
import { t } from "src/ui/i18n";

interface FromToProps {
  fromOption: ConversionOption | null;
  toOption: ConversionOption | null;
  fromCount: number;
  toCount: number;
  direction: "from" | "to";
  onClickFrom: () => void;
  onClickTo: () => void;
}

function ExtPill({
  option,
  placeholder,
  count,
  kind,
  selected,
  onClick,
}: {
  option: ConversionOption | null;
  placeholder: boolean;
  count: number;
  kind: "input" | "output";
  selected: boolean;
  onClick: () => void;
}) {
  const ext = option?.[0].extension?.toUpperCase();
  const mime = option?.[0].mime;
  const label = t("fromto.count", {
    n: count,
    kind: t(kind === "input" ? "fromto.input" : "fromto.output"),
  });

  return (
    <button
      type="button"
      className={`fromto-pill ${placeholder ? "is-placeholder" : ""} ${selected ? "active" : ""}`}
      onClick={onClick}
      aria-label={
        placeholder
          ? label
          : t(kind === "input" ? "fromto.selectedInput" : "fromto.selectedOutput", {
              ext: ext ?? "",
            })
      }
    >
      {placeholder ? (
        <span className="fromto-count">{label}</span>
      ) : (
        <>
          <FileIcon
            extension={option?.[0].extension}
            mimeType={mime}
            category={option?.[0].category}
            size={22}
          />
          <bdi className="fromto-ext">.{ext}</bdi>
        </>
      )}
    </button>
  );
}

export default function FromTo({
  fromOption,
  toOption,
  fromCount,
  toCount,
  direction,
  onClickFrom,
  onClickTo,
}: FromToProps) {
  return (
    <div className="fromto">
      <ExtPill
        option={fromOption}
        placeholder={!fromOption}
        count={fromCount}
        kind="input"
        selected={direction === "from"}
        onClick={onClickFrom}
      />
      <div className="fromto-arrow" aria-hidden="true">
        <ArrowRight size={30} className="dir-flip" />
      </div>
      <ExtPill
        option={toOption}
        placeholder={!toOption}
        count={toCount}
        kind="output"
        selected={direction === "to"}
        onClick={onClickTo}
      />
    </div>
  );
}
