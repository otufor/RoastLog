import { createFileRoute } from "@tanstack/react-router";

function AnalysisPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">分析</h1>
      <p className="text-muted-foreground">分析グラフは近日公開予定です。</p>
    </div>
  );
}

export const Route = createFileRoute("/analysis/")({
  component: AnalysisPage,
});
