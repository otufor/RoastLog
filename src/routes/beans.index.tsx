import { createFileRoute } from "@tanstack/react-router";
import { BeanListPage } from "@/components/BeanListPage";

export const Route = createFileRoute("/beans/")({
  component: BeanListPage,
});
