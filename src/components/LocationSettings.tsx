import { useForm } from "@tanstack/react-form";
import { MapPin } from "lucide-react";
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
    } catch (err) {
      console.warn("Failed to fetch location:", err);
      if (
        err instanceof GeolocationPositionError &&
        err.code === err.PERMISSION_DENIED
      ) {
        setError("位置情報の利用が許可されていません");
      } else {
        setError("位置情報を取得できませんでした");
      }
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
    <div className="flex flex-col gap-3 p-4">
      {hasLocation ? (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="size-5" aria-hidden />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium">
              {settings.locationLabel || "（場所名なし）"}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {settings.locationLat?.toFixed(4)},{" "}
              {settings.locationLon?.toFixed(4)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchLocation}
            disabled={busy}
          >
            {busy ? "取得中..." : "再取得"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            位置情報が設定されていません
          </p>
          <Button onClick={handleFetchLocation} disabled={busy} size="sm">
            {busy ? "取得中..." : "位置情報を取得する"}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {hasLocation && (
        <>
          <LocationLabelForm
            key={settings.locationLabel || "__no_label__"}
            currentLabel={settings.locationLabel}
            onSubmit={async (label) => {
              await update.mutateAsync({ ...settings, locationLabel: label });
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-muted-foreground"
            onClick={handleClearLocation}
          >
            位置情報を削除
          </Button>
        </>
      )}
    </div>
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
