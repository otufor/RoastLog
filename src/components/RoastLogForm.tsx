import { useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";
import { TimePicker } from "@/components/TimePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calcWeightLossRate } from "@/domain/roastLog";
import type { Bean } from "@/schemas/bean";
import type { RoastDevice, RoastLevel } from "@/schemas/masterData";
import type { CreateRoastLogInput } from "@/schemas/roastLog";

const FormSchema = z.object({
  beanId: z.string().min(1, "豆を選択してください"),
  roastDate: z.string().min(1, "焙煎日を入力してください"),
  roastLevelId: z.string().min(1, "焙煎度を選択してください"),
  roastDeviceId: z.string().nullable(),
  roastDurationSec: z.number().int().nonnegative(),
  firstCrackSec: z.number().int().nonnegative().nullable(),
  secondCrackSec: z.number().int().nonnegative().nullable(),
  weightBeforeG: z
    .number()
    .positive("焙煎前重量は0より大きい値を入力してください"),
  weightAfterG: z
    .number()
    .positive("焙煎後重量は0より大きい値を入力してください"),
  indoorTempC: z.number().nullable(),
  processNote: z.string(),
});

interface RoastLogFormProps {
  defaultValues: CreateRoastLogInput;
  beans: Bean[];
  roastLevels: RoastLevel[];
  roastDevices: RoastDevice[];
  submitLabel: string;
  onSubmit: (input: CreateRoastLogInput) => void | Promise<void>;
}

export function RoastLogForm({
  defaultValues,
  beans,
  roastLevels,
  roastDevices,
  submitLabel,
  onSubmit,
}: RoastLogFormProps) {
  const form = useForm({
    defaultValues: {
      beanId: defaultValues.beanId,
      roastDate: defaultValues.roastDate,
      roastLevelId: defaultValues.roastLevelId,
      roastDeviceId: defaultValues.roastDeviceId,
      roastDurationSec: defaultValues.roastDurationSec,
      firstCrackSec: defaultValues.firstCrackSec,
      secondCrackSec: defaultValues.secondCrackSec,
      weightBeforeG: defaultValues.weightBeforeG,
      weightAfterG: defaultValues.weightAfterG,
      indoorTempC: defaultValues.indoorTempC,
      processNote: defaultValues.processNote,
    },
    validators: { onSubmit: FormSchema },
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...defaultValues,
        ...value,
      });
    },
  });

  const weightLossRate = useStore(form.store, (state) =>
    calcWeightLossRate(state.values.weightBeforeG, state.values.weightAfterG),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      {/* 豆 */}
      <form.Field name="beanId">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="log-bean-id">豆</Label>
            <Select
              value={field.state.value || null}
              onValueChange={(v) => field.handleChange(v ?? "")}
            >
              <SelectTrigger id="log-bean-id" className="w-full">
                <SelectValue placeholder="豆を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {beans.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {field.state.meta.errors.map((err) =>
              err ? (
                <span
                  key={err.message ?? String(err)}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {err.message ?? String(err)}
                </span>
              ) : null,
            )}
          </div>
        )}
      </form.Field>

      {/* 焙煎日 */}
      <form.Field name="roastDate">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="log-roast-date">焙煎日</Label>
            <Input
              id="log-roast-date"
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.map((err) =>
              err ? (
                <span
                  key={err.message ?? String(err)}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {err.message ?? String(err)}
                </span>
              ) : null,
            )}
          </div>
        )}
      </form.Field>

      {/* 焙煎度 */}
      <form.Field name="roastLevelId">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="log-roast-level-id">焙煎度</Label>
            <Select
              value={field.state.value || null}
              onValueChange={(v) => field.handleChange(v ?? "")}
            >
              <SelectTrigger id="log-roast-level-id" className="w-full">
                <SelectValue placeholder="焙煎度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roastLevels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {field.state.meta.errors.map((err) =>
              err ? (
                <span
                  key={err.message ?? String(err)}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {err.message ?? String(err)}
                </span>
              ) : null,
            )}
          </div>
        )}
      </form.Field>

      {/* 焙煎機 */}
      <form.Field name="roastDeviceId">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="log-roast-device-id">焙煎機</Label>
            <Select
              value={field.state.value ?? undefined}
              onValueChange={(v) => field.handleChange(v === "" ? null : v)}
            >
              <SelectTrigger id="log-roast-device-id" className="w-full">
                <SelectValue placeholder="なし" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">なし</SelectItem>
                  {roastDevices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      {/* 焙煎時間 */}
      <form.Field name="roastDurationSec">
        {(field) => (
          <TimePicker
            label="焙煎時間"
            value={field.state.value}
            onChange={(v) => field.handleChange(v ?? 0)}
          />
        )}
      </form.Field>

      {/* 1ハゼ */}
      <form.Field name="firstCrackSec">
        {(field) => (
          <TimePicker
            label="1ハゼ"
            value={field.state.value}
            onChange={(v) => field.handleChange(v)}
            nullable
          />
        )}
      </form.Field>

      {/* 2ハゼ */}
      <form.Field name="secondCrackSec">
        {(field) => (
          <TimePicker
            label="2ハゼ"
            value={field.state.value}
            onChange={(v) => field.handleChange(v)}
            nullable
          />
        )}
      </form.Field>

      {/* 重量 + WeightLossRate */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <form.Field name="weightBeforeG">
            {(field) => (
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor="log-weight-before">焙煎前重量 (g)</Label>
                <Input
                  id="log-weight-before"
                  type="number"
                  min={0}
                  step={0.1}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
                {field.state.meta.errors.map((err) =>
                  err ? (
                    <span
                      key={err.message ?? String(err)}
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {err.message ?? String(err)}
                    </span>
                  ) : null,
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="weightAfterG">
            {(field) => (
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor="log-weight-after">焙煎後重量 (g)</Label>
                <Input
                  id="log-weight-after"
                  type="number"
                  min={0}
                  step={0.1}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
                {field.state.meta.errors.map((err) =>
                  err ? (
                    <span
                      key={err.message ?? String(err)}
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {err.message ?? String(err)}
                    </span>
                  ) : null,
                )}
              </div>
            )}
          </form.Field>
        </div>

        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-sm text-muted-foreground">重量減少率</span>
          <span className="font-mono text-sm font-medium">
            {weightLossRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 室内温度 */}
      <form.Field name="indoorTempC">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="log-indoor-temp">室内温度 (℃)</Label>
            <Input
              id="log-indoor-temp"
              type="number"
              step={0.1}
              value={field.state.value ?? ""}
              onChange={(e) =>
                field.handleChange(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </div>
        )}
      </form.Field>

      {/* メモ */}
      <form.Field name="processNote">
        {(field) => (
          <div className="flex flex-col gap-1">
            <Label htmlFor="log-process-note">焙煎メモ</Label>
            <Textarea
              id="log-process-note"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </form.Field>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
