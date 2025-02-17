import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,  // Existing browser globals
        ...globals.jest,     // Add Jest globals
      },
    },
  },
  pluginJs.configs.recommended,
];
