import { createFileRoute } from "@tanstack/react-router";
import { AnalysisPage } from "@/components/AnalysisPage";

export const Route = createFileRoute("/analysis/")({
  component: AnalysisPage,
});
