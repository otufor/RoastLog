import { createFileRoute } from "@tanstack/react-router";
import { RoastLogListPage } from "@/components/RoastLogListPage";

export const Route = createFileRoute("/logs/")({
  component: RoastLogListPage,
});
