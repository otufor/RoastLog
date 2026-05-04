import { createFileRoute } from "@tanstack/react-router";
import { RoastLogDetailPage } from "@/components/RoastLogDetailPage";

export const Route = createFileRoute("/logs/$logId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { logId } = Route.useParams();
  return <RoastLogDetailPage logId={logId} />;
}
