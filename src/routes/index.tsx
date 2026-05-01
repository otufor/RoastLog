import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <div>
      <h1>RoastLog</h1>
      <p>焙煎ログ管理アプリ</p>
    </div>
  ),
});
