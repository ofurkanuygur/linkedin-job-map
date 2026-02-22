export default [
  {
    files: ["content.js", "options.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        location: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        URL: "readonly",
        Blob: "readonly",
        Promise: "readonly",
        MutationObserver: "readonly",
        AbortController: "readonly",
        chrome: "readonly",
        L: "readonly",
        console: "readonly",
        module: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-redeclare": "error",
      "eqeqeq": ["warn", "smart"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error"
    }
  },
  {
    ignores: [
      "leaflet.js",
      "leaflet.markercluster.js",
      "node_modules/**",
      "coverage/**",
      "tests/**"
    ]
  }
];
