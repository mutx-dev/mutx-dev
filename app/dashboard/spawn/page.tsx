"use client";

import { useState } from "react";
import { Plus, Rocket, Cpu, Brain, Zap, ChevronRight, Settings, X } from "lucide-react";

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

export default function DashboardSpawnPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [tools, setTools] = useState<string[]>(["web-search", "code-executor", "file-system"]);
  const [config, setConfig] = useState({ maxTokens: 4000, temperature: 0.7, maxSteps: 100 });

  const toggleTool = (id: string) => {
    setTools(tools.includes(id) ? tools.filter(t => t !== id) : [...tools, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
          <Rocket className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">Spawn Agent</h1>
          <p className="mt-1 text-sm text-slate-400">Create and configure a new agent instance</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step >= s ? "bg-cyan-400 text-black" : "bg-white/10 text-slate-400"}`}>
              {s}
            </div>
            <span className={`text-sm ${step >= s ? "text-white" : "text-slate-400"}`}>
              {s === 1 ? "Basic" : s === 2 ? "Model" : "Tools"}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-slate-600" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0e] p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Basic Configuration</h2>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Agent Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="my-agent"
                className="w-full rounded-lg border border-white/10 bg-[#030307] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Description</label>
              <textarea rows={3} placeholder="What does this agent do?"
                className="w-full rounded-lg border border-white/10 bg-[#030307] px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Model Selection</h2>
            <div className="grid gap-3">
              {modelOptions.map((m) => (
                <button key={m.id} onClick={() => setModel(m.id)}
                  className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${model === m.id ? "border-cyan-400 bg-cyan-400/10" : "border-white/10 hover:border-white/20"}`}>
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
            <h2 className="text-xl font-semibold text-white">Tools & Capabilities</h2>
            <div className="space-y-3">
              {toolOptions.map((tool) => (
                <button key={tool.id} onClick={() => toggleTool(tool.id)}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all ${tools.includes(tool.id) ? "border-emerald-400 bg-emerald-400/10" : "border-white/10"}`}>
                  <span className="text-white">{tool.name}</span>
                  <div className={`h-5 w-5 rounded border ${tools.includes(tool.id) ? "bg-emerald-400 border-emerald-400" : "border-slate-600"}`}>
                    {tools.includes(tool.id) && <Zap className="h-full w-full text-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50">
            Back
          </button>
          <button onClick={() => step < 3 ? setStep(step + 1) : console.log("Spawn!")}
            className="flex items-center gap-2 rounded-lg bg-cyan-400 px-6 py-2 text-sm font-medium text-black hover:bg-cyan-300">
            {step === 3 ? "Spawn Agent" : "Continue"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
