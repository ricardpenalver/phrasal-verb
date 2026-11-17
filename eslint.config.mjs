import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layer boundaries (see CLAUDE.md). Allowed import direction:
//   content  <-  engine  <-  ai, app
// content and engine stay framework-free so they run and test without a
// network, a browser, or the Next.js runtime.

const frameworkImports = {
  regex: "^(next|react|react-dom|server-only|client-only)(/|$)",
  message:
    "content/ and engine/ are framework-free. Move this code to src/app or src/ai.",
};

const upperLayers = (layers) => ({
  regex: `^(@|\\.{1,2})(/.*)?/(${layers.join("|")})(/|$)`,
  message: `This layer must not import from: ${layers.join(", ")}.`,
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/content/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [frameworkImports, upperLayers(["engine", "ai", "app"])] },
      ],
    },
  },
  {
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [frameworkImports, upperLayers(["ai", "app"])] },
      ],
      // Grading and scheduling must be reproducible: time, randomness and I/O
      // are passed in by the caller, never read from the environment.
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "The engine performs no I/O." },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Date",
          property: "now",
          message: "Take the current time as a parameter.",
        },
        {
          object: "Math",
          property: "random",
          message: "Take a random source as a parameter.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Take the current time as a parameter.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
