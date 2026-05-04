import Picker from "react-mobile-picker";
import { Label } from "@/components/ui/label";

const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const SECONDS = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

function toPickerValue(seconds: number): { mm: string; ss: string } {
  return {
    mm: String(Math.floor(seconds / 60)).padStart(2, "0"),
    ss: String(seconds % 60).padStart(2, "0"),
  };
}

interface TimePickerProps {
  label: string;
  value: number | null;
  onChange: (seconds: number | null) => void;
  nullable?: boolean;
}

export function TimePicker({
  label,
  value,
  onChange,
  nullable = false,
}: TimePickerProps) {
  const isNull = value === null;
  const pickerValue = toPickerValue(value ?? 0);
  const displayText = `${pickerValue.mm}:${pickerValue.ss}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground">
            {displayText}
          </span>
          {nullable && (
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                aria-label="なし"
                checked={isNull}
                onChange={() => onChange(isNull ? 0 : null)}
                className="size-4"
              />
              なし
            </label>
          )}
        </div>
      </div>
      {!isNull && (
        <Picker
          value={pickerValue}
          onChange={({ mm, ss }) =>
            onChange(parseInt(mm, 10) * 60 + parseInt(ss, 10))
          }
          wheelMode="natural"
          height={120}
          itemHeight={40}
        >
          <Picker.Column name="mm">
            {MINUTES.map((m) => (
              <Picker.Item key={m} value={m}>
                {m}
              </Picker.Item>
            ))}
          </Picker.Column>
          <Picker.Column name="ss">
            {SECONDS.map((s) => (
              <Picker.Item key={s} value={s}>
                {s}
              </Picker.Item>
            ))}
          </Picker.Column>
        </Picker>
      )}
    </div>
  );
}
