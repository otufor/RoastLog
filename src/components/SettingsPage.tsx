import { CsvSection } from "@/components/CsvSection";
import { FlavorTagSettings } from "@/components/FlavorTagSettings";
import { LocationSettings } from "@/components/LocationSettings";
import { RoastDeviceSettings } from "@/components/RoastDeviceSettings";
import { RoastLevelSettings } from "@/components/RoastLevelSettings";

function SettingsSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="px-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </h2>
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        {children}
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="py-2 text-xl font-semibold">設定</h1>
      <SettingsSection label="位置情報">
        <LocationSettings />
      </SettingsSection>
      <SettingsSection label="焙煎度ラベル">
        <RoastLevelSettings />
      </SettingsSection>
      <SettingsSection label="フレーバータグ">
        <FlavorTagSettings />
      </SettingsSection>
      <SettingsSection label="焙煎機">
        <RoastDeviceSettings />
      </SettingsSection>
      <SettingsSection label="データ管理">
        <CsvSection />
      </SettingsSection>
    </div>
  );
}
