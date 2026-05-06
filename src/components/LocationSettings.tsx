import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/useAppSettings";
import { AppSettingsSchema } from "@/schemas/appSettings";

export function LocationSettings() {
  const { data: settings, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading || !settings) return null;

  const handleFetchLocation = async () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("この端末は位置情報に対応していません");
      return;
    }
    setBusy(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10_000,
            maximumAge: 60_000,
          });
        },
      );
      await update.mutateAsync({
        ...settings,
        locationLat: position.coords.latitude,
        locationLon: position.coords.longitude,
      });
    } catch {
      setError("位置情報を取得できませんでした");
    } finally {
      setBusy(false);
    }
  };

  const handleClearLocation = async () => {
    setError(null);
    await update.mutateAsync({
      ...settings,
      locationLat: null,
      locationLon: null,
    });
  };

  const hasLocation =
    settings.locationLat !== null && settings.locationLon !== null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">位置情報</h2>
        <Button onClick={handleFetchLocation} disabled={busy}>
          {busy ? "取得中..." : "位置情報を取得する"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        焙煎ログ作成時に外気温・湿度・天気を自動取得します。位置情報は端末内（localStorage）にのみ保存されます。
      </p>

      <div className="rounded-lg border p-3 flex flex-col gap-2">
        {hasLocation ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">
                {settings.locationLabel || "（場所名なし）"}
              </span>
              <Button variant="outline" onClick={handleClearLocation}>
                位置情報を削除
              </Button>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              緯度 {settings.locationLat?.toFixed(4)}, 経度{" "}
              {settings.locationLon?.toFixed(4)}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            位置情報が設定されていません
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <LocationLabelForm
        key={settings.locationLabel}
        currentLabel={settings.locationLabel}
        onSubmit={async (label) => {
          await update.mutateAsync({ ...settings, locationLabel: label });
        }}
      />
    </section>
  );
}

function LocationLabelForm({
  currentLabel,
  onSubmit,
}: {
  currentLabel: string;
  onSubmit: (label: string) => void | Promise<void>;
}) {
  const form = useForm({
    defaultValues: { locationLabel: currentLabel },
    validators: { onSubmit: AppSettingsSchema.pick({ locationLabel: true }) },
    onSubmit: async ({ value }) => {
      await onSubmit(value.locationLabel);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex items-end gap-2"
    >
      <form.Field name="locationLabel">
        {(field) => (
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="location-label">場所の名前</Label>
            <Input
              id="location-label"
              placeholder="自宅（福井）"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>
      <Button type="submit">保存</Button>
    </form>
  );
}
