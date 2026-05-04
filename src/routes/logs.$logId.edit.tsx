import { createFileRoute } from "@tanstack/react-router";
import { RoastLogEditPage } from "@/components/RoastLogEditPage";

export const Route = createFileRoute("/logs/$logId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { logId } = Route.useParams();
  return <RoastLogEditPage logId={logId} />;
}
