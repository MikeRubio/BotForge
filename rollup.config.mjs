import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";
import nodePolyfills from "rollup-plugin-polyfill-node";

import fs from "fs";
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

const external = [
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
];

const plugins = [
  nodePolyfills(),
  peerDepsExternal(),
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs(),
  typescript({
    tsconfig: "./tsconfig.json",
    exclude: ["**/*.test.*", "**/*.stories.*"],
  }),
  json(),
];

export default [
  // ES Module build
  {
    input: "src/index.ts",
    output: {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
    },
    plugins,
    external,
  },
  // CommonJS build
  {
    input: "src/index.ts",
    output: {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
    },
    plugins,
    external,
  },
  // UMD build for vanilla JS
  {
    input: "src/vanilla/init.ts",
    output: {
      file: "dist/botforge-widget.umd.js",
      format: "umd",
      name: "BotForge",
      sourcemap: true,
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
        "react-dom/client": "ReactDOM",
        "react/jsx-runtime": "jsxRuntime",
      },
    },
    plugins: [...plugins, terser()],
    external,
  },
  // Type definitions
  {
    input: "dist/types/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "esm" }],
    plugins: [dts()],
    external: [/\.css$/],
  },
];
