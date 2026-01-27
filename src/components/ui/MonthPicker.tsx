import { useMemo } from "react";
import "./MonthPicker.css";

type MonthPickerProps = {
  monthKey: string;
  monthOptions: string[];
  onChange: (monthKey: string) => void;
  ariaLabel?: string;
};

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const splitMonthKey = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  return { year: year ?? "", month: month ?? "" };
};

const buildMonthKey = (year: string, month: string) => `${year}-${month.padStart(2, "0")}`;

export const MonthPicker = ({
  monthKey,
  monthOptions,
  onChange,
  ariaLabel = "Select month",
}: MonthPickerProps) => {
  const supportsMonthInput = useMemo(() => {
    if (typeof document === "undefined") return true;
    const input = document.createElement("input");
    input.type = "month";
    return input.type === "month";
  }, []);

  const { year, month } = splitMonthKey(monthKey);

  if (supportsMonthInput) {
    return (
      <label className="input">
        <input
          type="month"
          value={monthKey}
          aria-label={ariaLabel}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  const years = Array.from(new Set(monthOptions.map((key) => key.split("-")[0] ?? ""))).filter(
    Boolean,
  );
  years.sort();

  const monthValue = month || "01";

  return (
    <div className="month-picker-fallback">
      <label className="select">
        <select
          aria-label={`${ariaLabel} month`}
          value={monthValue}
          onChange={(event) => onChange(buildMonthKey(year, event.target.value))}
        >
          {monthLabels.map((label, index) => {
            const value = String(index + 1).padStart(2, "0");
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      </label>
      <label className="select">
        <select
          aria-label={`${ariaLabel} year`}
          value={year}
          onChange={(event) => onChange(buildMonthKey(event.target.value, monthValue))}
        >
          {years.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
