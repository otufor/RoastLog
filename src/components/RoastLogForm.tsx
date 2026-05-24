import { useForm, useStore } from "@tanstack/react-form";
import { useEffect } from "react";
import { z } from "zod";
import { StarRating } from "@/components/StarRating";
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
import { buildTasting, validateTastingAxes } from "@/domain/tasting";
import { weatherEmoji } from "@/lib/weatherEmoji";
import type { Bean } from "@/schemas/bean";
import type { FlavorTag, RoastDevice, RoastLevel } from "@/schemas/masterData";
import type { CreateRoastLogInput } from "@/schemas/roastLog";

const TastingAxisScore = z.number().int().min(1).max(5).nullable();

const FormSchema = z
  .object({
    beanId: z.string().min(1, "豆を選択してください"),
    roastDate: z.string().min(1, "焙煎日を入力してください"),
    roastLevelId: z.string().min(1, "焙煎度を選択してください"),
    roastDeviceId: z.string().nullable(),
    roastDurationSec: z.number().int().nonnegative(),
    firstCrackSec: z.number().int().nonnegative().nullable(),
    secondCrackSec: z.number().int().nonnegative().nullable(),
    weightBeforeG: z
      .number()
      .positive("焙煎前重量は0より大きい値を入力してください")
      .nullable(),
    weightAfterG: z
      .number()
      .positive("焙煎後重量は0より大きい値を入力してください")
      .nullable(),
    indoorTempC: z.number().nullable(),
    outdoorTempC: z.number().nullable(),
    outdoorHumidity: z.number().min(0).max(100).nullable(),
    weatherCode: z.number().int().nullable(),
    tempSource: z.enum(["auto", "manual"]),
    processNote: z.string(),
    flavorTagIds: z.array(z.string()),
    sweetness: TastingAxisScore,
    acidity: TastingAxisScore,
    body: TastingAxisScore,
    bitterness: TastingAxisScore,
    aftertaste: TastingAxisScore,
    cleanliness: TastingAxisScore,
    overallScore: TastingAxisScore,
  })
  .superRefine((data, ctx) => {
    const axes = [
      data.sweetness,
      data.acidity,
      data.body,
      data.bitterness,
      data.aftertaste,
      data.cleanliness,
    ];
    if (!validateTastingAxes(axes)) {
      ctx.addIssue({
        code: "custom",
        message:
          "テイスティングを保存するには6軸すべての評価を入力してください",
      });
    }
  });

export type RoastLogFormValues = z.infer<typeof FormSchema>;

interface RoastLogFormProps {
  defaultValues: CreateRoastLogInput;
  beans: Bean[];
  roastLevels: RoastLevel[];
  roastDevices: RoastDevice[];
  flavorTags: FlavorTag[];
  submitLabel: string;
  onSubmit: (input: CreateRoastLogInput) => void | Promise<void>;
  onValuesChange?: (values: RoastLogFormValues) => void;
}

export function RoastLogForm({
  defaultValues,
  beans,
  roastLevels,
  roastDevices,
  flavorTags,
  submitLabel,
  onSubmit,
  onValuesChange,
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
      outdoorTempC: defaultValues.outdoorTempC,
      outdoorHumidity: defaultValues.outdoorHumidity,
      weatherCode: defaultValues.weatherCode,
      tempSource: defaultValues.tempSource,
      processNote: defaultValues.processNote,
      flavorTagIds: defaultValues.tasting?.flavorTags ?? [],
      sweetness: defaultValues.tasting?.sweetness ?? null,
      acidity: defaultValues.tasting?.acidity ?? null,
      body: defaultValues.tasting?.body ?? null,
      bitterness: defaultValues.tasting?.bitterness ?? null,
      aftertaste: defaultValues.tasting?.aftertaste ?? null,
      cleanliness: defaultValues.tasting?.cleanliness ?? null,
      overallScore: defaultValues.overallScore ?? null,
    },
    validators: { onSubmit: FormSchema },
    onSubmit: async ({ value }) => {
      const {
        flavorTagIds,
        sweetness,
        acidity,
        body,
        bitterness,
        aftertaste,
        cleanliness,
        overallScore,
        ...formRest
      } = value;
      const tasting = buildTasting(
        flavorTagIds,
        sweetness,
        acidity,
        body,
        bitterness,
        aftertaste,
        cleanliness,
      );
      await onSubmit({
        ...defaultValues,
        ...formRest,
        tasting,
        overallScore,
      });
    },
  });

  const weightLossRate = useStore(form.store, (state) =>
    calcWeightLossRate(state.values.weightBeforeG, state.values.weightAfterG),
  );
  const formErrors = useStore(form.store, (state) => state.errors);
  const draftValues = useStore(form.store, (state) => state.values);
  useEffect(() => {
    onValuesChange?.(draftValues);
  }, [draftValues, onValuesChange]);

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
              items={beans.map((b) => ({ value: b.id, label: b.name }))}
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
              items={roastLevels.map((l) => ({ value: l.id, label: l.label }))}
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
              items={[
                { value: "", label: "なし" },
                ...roastDevices.map((d) => ({ value: d.id, label: d.name })),
              ]}
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
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
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
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
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
            {weightLossRate !== null ? `${weightLossRate.toFixed(1)}%` : "—"}
          </span>
        </div>
      </div>

      {/* 天気 */}
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">天気</span>
          <form.Subscribe selector={(state) => state.values.weatherCode}>
            {(code) => {
              const emoji = weatherEmoji(code);
              return (
                <span role="img" aria-label="天気" className="text-xl">
                  {emoji || "—"}
                </span>
              );
            }}
          </form.Subscribe>
        </div>
        <div className="flex gap-3">
          <form.Field name="outdoorTempC">
            {(field) => (
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor="log-outdoor-temp">外気温 (℃)</Label>
                <Input
                  id="log-outdoor-temp"
                  type="number"
                  step={0.1}
                  value={field.state.value ?? ""}
                  onChange={(e) => {
                    const next =
                      e.target.value === "" ? null : Number(e.target.value);
                    field.handleChange(next);
                    form.setFieldValue("tempSource", "manual");
                  }}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="outdoorHumidity">
            {(field) => (
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor="log-outdoor-humidity">外気湿度 (%)</Label>
                <Input
                  id="log-outdoor-humidity"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
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

      {/* テイスティング */}
      <div className="border-t pt-4 flex flex-col gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          テイスティング（任意）
        </p>

        {/* フレーバーノート */}
        {flavorTags.length > 0 && (
          <form.Field name="flavorTagIds">
            {(field) => (
              <fieldset className="border-0 p-0 m-0">
                <legend className="text-sm text-muted-foreground mb-2">
                  フレーバーノート
                </legend>
                <div className="flex flex-wrap gap-2">
                  {flavorTags.map((tag) => {
                    const selected = field.state.value.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          const next = selected
                            ? field.state.value.filter((id) => id !== tag.id)
                            : [...field.state.value, tag.id];
                          field.handleChange(next);
                        }}
                        style={{
                          background: selected ? `${tag.color}1A` : undefined,
                          color: selected ? tag.color : undefined,
                          borderColor: selected ? `${tag.color}66` : undefined,
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer border ${
                          selected
                            ? ""
                            : "border-border text-muted-foreground bg-muted"
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: selected
                              ? tag.color
                              : "var(--muted-foreground)",
                          }}
                        />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </form.Field>
        )}

        {/* 6軸評価 */}
        <div className="flex flex-col gap-3">
          <form.Field name="sweetness">
            {(field) => (
              <div className="flex items-center justify-between">
                <Label className="text-sm">甘さ</Label>
                <StarRating
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="acidity">
            {(field) => (
              <div className="flex items-center justify-between">
                <Label className="text-sm">酸味</Label>
                <StarRating
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="body">
            {(field) => (
              <div className="flex items-center justify-between">
                <Label className="text-sm">コク</Label>
                <StarRating
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="bitterness">
            {(field) => (
              <div className="flex items-center justify-between">
                <Label className="text-sm">苦み</Label>
                <StarRating
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="aftertaste">
            {(field) => (
              <div className="flex items-center justify-between">
                <Label className="text-sm">後味</Label>
                <StarRating
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="cleanliness">
            {(field) => (
              <div className="flex items-center justify-between">
                <Label className="text-sm">クリーン</Label>
                <StarRating
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>
        </div>

        {formErrors.length > 0 &&
          formErrors.map((err) =>
            err ? (
              <span
                key={String(err)}
                role="alert"
                className="text-sm text-destructive"
              >
                {String(err)}
              </span>
            ) : null,
          )}

        {/* 総合評価 */}
        <div className="border-t pt-3">
          <form.Field name="overallScore">
            {(field) => (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">総合評価</Label>
                <StarRating
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
