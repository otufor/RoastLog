import type { FlavorTag, RoastDevice, RoastLevel } from "@/schemas/masterData";

export const ROAST_LEVEL_PRESETS: readonly RoastLevel[] = [
  { id: "green", label: "生豆", color: "#8FAF6B", order: 0 },
  { id: "light", label: "浅煎り", color: "#E8C84A", order: 1 },
  { id: "medium-light", label: "中浅煎り", color: "#D4943A", order: 2 },
  { id: "medium", label: "中煎り", color: "#B06B1E", order: 3 },
  { id: "medium-dark", label: "中深煎り", color: "#7A3F0E", order: 4 },
  { id: "dark", label: "深煎り", color: "#3E1A06", order: 5 },
  { id: "italian", label: "イタリアン", color: "#1F0A02", order: 6 },
];

export const FLAVOR_TAG_PRESETS: readonly FlavorTag[] = [
  { id: "floral", name: "フローラル", color: "#F9A8D4" },
  { id: "citrus", name: "シトラス", color: "#FDE68A" },
  { id: "fruity", name: "フルーティー", color: "#FCA5A5" },
  { id: "berry", name: "ベリー", color: "#C4B5FD" },
  { id: "nutty", name: "ナッツ", color: "#D4B483" },
  { id: "chocolate", name: "チョコレート", color: "#92400E" },
  { id: "caramel", name: "キャラメル", color: "#D97706" },
  { id: "spicy", name: "スパイシー", color: "#EF4444" },
  { id: "herbal", name: "ハーブ", color: "#86EFAC" },
  { id: "earthy", name: "アーシー", color: "#A16207" },
];

export const ROAST_DEVICE_PRESETS: readonly RoastDevice[] = [
  {
    id: "weroast-home-roaster",
    name: "weroast HOME ROASTER",
    method: "熱風式",
    note: "",
  },
];
