const { app } = require("electron");
const fs = require("fs");
const path = require("path");

const DEFAULT_CONTEXT = {
  mode: "hosted",
  apiUrl: "https://api.mutx.dev",
  updatedAt: null,
};

function getRuntimeContextPath() {
  return path.join(app.getPath("userData"), "runtime-context.json");
}

function ensureRuntimeContext() {
  const filePath = getRuntimeContextPath();
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({ ...DEFAULT_CONTEXT, updatedAt: new Date().toISOString() }, null, 2),
      "utf8"
    );
  }
  return filePath;
}

function readRuntimeContext() {
  const filePath = ensureRuntimeContext();
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONTEXT,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_CONTEXT };
  }
}

function writeRuntimeContext(updates) {
  const filePath = getRuntimeContextPath();
  const nextContext = {
    ...readRuntimeContext(),
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(nextContext, null, 2), "utf8");
  return nextContext;
}

module.exports = {
  DEFAULT_CONTEXT,
  ensureRuntimeContext,
  getRuntimeContextPath,
  readRuntimeContext,
  writeRuntimeContext,
};
