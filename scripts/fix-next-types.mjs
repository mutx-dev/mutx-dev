#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const targets = [
  ".next/types/routes.js",
  ".next/dev/types/routes.js",
];

for (const relativeTarget of targets) {
  const absoluteTarget = resolve(process.cwd(), relativeTarget);
  const declarationTarget = absoluteTarget.replace(/\.js$/, ".d.ts");

  if (!existsSync(declarationTarget) || existsSync(absoluteTarget)) {
    continue;
  }

  mkdirSync(dirname(absoluteTarget), { recursive: true });
  writeFileSync(absoluteTarget, "export {};\n", "utf8");
}
