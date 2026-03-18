"use client";

import { useState } from "react";
import { Plus, Rocket, Brain, Zap, ChevronRight, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const modelOptions = [
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "gpt-5.4", name: "GPT-5.4", provider: "OpenAI" },
  { id: "gpt-5.3-codex-spark", name: "Codex Spark", provider: "OpenAI" },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", provider: "Google" },
];

const toolOptions = [
  { id: "web-search", name: "Web Search", enabled: true },
  { id: "code-executor", name: "Code Executor", enabled: true },
  { id: "file-system", name: "File System", enabled: true },
  { id: "webhook-caller", name: "Webhook Caller", enabled: false },
  { id: "database-query", name: "Database Query", enabled: false },
];

type SpawnState = "idle" | "loading" | "success" | "error";

export default function DashboardSpawnPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("");
  const [tools, setTools] = useState<string[]>(["web-search", "code-executor", "file-system"]);
  const [spawnState, setSpawnState] = useState<SpawnState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleTool = (id: string) => {
    setTools(tools.includes(id) ? tools.filter((t) => t !== id) : [...tools, id]);
  };

  const handleSpawn = async () => {
    if (!name.trim()) return;

    setSpawnState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/dashboard/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type: "agent",
          config: { model, tools },
        }),
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        setErrorMessage("Please sign in to create an agent.");
        setSpawnState("error");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.detail || data.error?.message || "Failed to create agent");
        setSpawnState("error");
        return;
      }

      setSpawnState("success");
      setTimeout(() => {
        setSpawnState("idle");
        setStep(1);
        setName("");
        setDescription("");
        setModel("");
        setTools(["web-search", "code-executor", "file-system"]);
      }, 2500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Network error");
      setSpawnState("error");
    }
  };

  const canProceed = step < 3 ? true : name.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
          <Rocket className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Spawn Agent</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and configure a new agent instance
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s ? "bg-cyan-400 text-black" : "bg-white/10 text-slate-400"
              }`}
            >
              {step > s ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                s
              )}
            </div>
            <span className={`text-sm ${step >= s ? "text-white" : "text-slate-400"}`}>
              {s === 1 ? "Basic" : s === 2 ? "Model" : "Tools"}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-slate-600" />}
          </div>
        ))}
      </div>

      {spawnState === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-200">Agent created successfully!</p>
            <p className="text-xs text-emerald-300/70">
              Redirecting to agents page...
            </p>
          </div>
        </div>
      )}

      {spawnState === "error" && (
        <div className="flex items-center justify-between rounded-xl border border-rose-400/20 bg-rose-400/10 p-4">
          <p className="text-sm text-rose-200">{errorMessage}</p>
          <button
            onClick={() => setSpawnState("idle")}
            className="text-rose-300 hover:text-rose-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Basic Configuration</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">
                Agent Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-agent"
                className="w-full rounded-lg border border-white/10 bg-[#030307] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this agent do?"
                className="w-full rounded-lg border border-white/10 bg-[#030307] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Model Selection</h2>
            <div className="grid gap-3">
              {modelOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${
                    model === m.id
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="text-sm text-slate-400">{m.provider}</p>
                  </div>
                  <Brain className="h-5 w-5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Tools &amp; Capabilities</h2>
            <div className="space-y-3">
              {toolOptions.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all ${
                    tools.includes(tool.id)
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-white/10"
                  }`}
                >
                  <span className="text-white">{tool.name}</span>
                  <div
                    className={`h-5 w-5 rounded border ${
                      tools.includes(tool.id) ? "bg-emerald-400 border-emerald-400" : "border-slate-600"
                    }`}
                  >
                    {tools.includes(tool.id) && <Zap className="h-full w-full text-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={() => (step < 3 ? setStep(step + 1) : void handleSpawn())}
            disabled={!canProceed || spawnState === "loading"}
            className={cn(
              "flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-colors",
              spawnState === "loading"
                ? "bg-cyan-400/50 text-black cursor-not-allowed"
                : canProceed
                  ? "bg-cyan-400 text-black hover:bg-cyan-300"
                  : "bg-white/10 text-slate-400 cursor-not-allowed"
            )}
          >
            {spawnState === "loading" ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Creating...
              </>
            ) : step === 3 ? (
              <>
                <Rocket className="h-4 w-4" />
                Spawn Agent
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
