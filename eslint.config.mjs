import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    // Node modules
    "node_modules/**",
    // Build outputs
    "apps/web/.next/**",
  ]),
  {
    rules: {
      // Disable pages router rule since we use App Router
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    rules: {
      // Allow using styles without checking because Next.js handles CSS imports
      "@next/next/no-unused-css": "off",
      // Allow underscore-prefixed unused params (e.g. Express error handlers)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_" }
      ],
    },
  },
]);

export default eslintConfig;
