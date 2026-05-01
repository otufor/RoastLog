/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-no-app-layers",
      comment:
        "src/domain/ は repositories・hooks・components・routes に依存禁止 (ADR-0004)",
      severity: "error",
      from: { path: "^src/domain" },
      to: {
        path: [
          "^src/repositories",
          "^src/hooks",
          "^src/components",
          "^src/routes",
        ],
      },
    },
    {
      name: "domain-no-framework-packages",
      comment:
        "src/domain/ はフレームワークパッケージ依存禁止 (ADR-0004): react, dexie, @tanstack/*",
      severity: "error",
      from: { path: "^src/domain" },
      to: {
        dependencyTypes: ["npm"],
        path: ["^react", "^dexie", "^@tanstack/"],
      },
    },
    {
      name: "schemas-no-app-layers",
      comment: "src/schemas/ は app 層に依存禁止。zod のみ許可",
      severity: "error",
      from: { path: "^src/schemas" },
      to: {
        path: [
          "^src/domain",
          "^src/repositories",
          "^src/hooks",
          "^src/components",
          "^src/routes",
        ],
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.app.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
