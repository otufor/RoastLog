import { createFileRoute } from "@tanstack/react-router";
import { RoastLogCreatePage } from "@/components/RoastLogCreatePage";

export const Route = createFileRoute("/logs/new")({
  component: RoastLogCreatePage,
});
