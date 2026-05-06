import { Link } from "@tanstack/react-router";
import { FlavorTagSettings } from "@/components/FlavorTagSettings";
import { LocationSettings } from "@/components/LocationSettings";
import { RoastDeviceSettings } from "@/components/RoastDeviceSettings";
import { RoastLevelSettings } from "@/components/RoastLevelSettings";

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">設定</h1>
        <Link to="/beans" className="text-sm underline">
          ← 生豆一覧へ
        </Link>
      </div>
      <RoastLevelSettings />
      <FlavorTagSettings />
      <RoastDeviceSettings />
      <LocationSettings />
    </div>
  );
}
