import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RoastLogCreatePage } from "@/components/RoastLogCreatePage";

export const Route = createFileRoute("/logs/new")({
  validateSearch: z.object({ fromLogId: z.string().uuid().optional() }),
  component: RouteComponent,
});

function RouteComponent() {
  const { fromLogId } = Route.useSearch();
  return <RoastLogCreatePage fromLogId={fromLogId} />;
}
