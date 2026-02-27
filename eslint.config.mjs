import globals from "globals";
import pluginJs from "@eslint/js";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { languageOptions: { globals: globals.node } },
  {
    files: ["index.js", "**/*.m?js"],
    plugins: { pluginJs }
  }
]);