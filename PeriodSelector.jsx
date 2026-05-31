import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "day", label: "當日" },
  { value: "week", label: "當週" },
  { value: "month", label: "當月" },
  { value: "year", label: "今年" },
  { value: "all", label: "全部" },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <div className="inline-flex bg-muted rounded-lg p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-all",
            value === o.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}