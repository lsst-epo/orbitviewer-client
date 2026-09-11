import { registerHooks } from "node:module";
// ESLint needs the old compiler API. Only this lint process resolves its
// TypeScript imports to the official compatibility package; builds use TS 7.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "typescript" || specifier.startsWith("typescript/")) {
      return nextResolve(
        specifier.replace(/^typescript/, "@typescript/legacy"),
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});
