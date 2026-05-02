import { createFileRoute } from "@tanstack/react-router";
import { BeanCreatePage } from "@/components/BeanCreatePage";

export const Route = createFileRoute("/beans/new")({
  component: BeanCreatePage,
});
