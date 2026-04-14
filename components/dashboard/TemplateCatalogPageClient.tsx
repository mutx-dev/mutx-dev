"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  ExternalLink,
  Gauge,
  Layers3,
  RefreshCw,
  Rocket,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { FeatureHint } from "@/components/dashboard/FeatureHint";
import { RouteHeader } from "@/components/dashboard/RouteHeader";
import { dashboardTokens } from "@/components/dashboard/tokens";

type TemplateSourceFilter = "all" | "official" | "imported";

type ChannelRecord = {
  label?: string;
  enabled?: boolean;
  mode?: string;
  allow_from?: string[];
};

type TemplateConfig = {
  model?: string;
  workspace?: string;
  system_prompt?: string;
  skills?: string[];
  channels?: Record<string, ChannelRecord>;
  metadata?: {
    template?: {
      kind?: string;
      source?: string;
      files?: string[];
      source_template_id?: string | null;
    };
  };
};

interface TemplateRecord {
  id: string;
  name: string;
  summary: string;
  description: string;
  starter_prompt: string;
  default_config?: TemplateConfig;
  category?: string;
  tags?: string[];
  is_official?: boolean;
  source_path?: string | null;
  version?: string | null;
  validation_status?: string;
  validation_message?: string | null;
}

interface DeploymentReceipt {
  templateId: string;
  agentId: string;
  deploymentId: string;
}

interface TemplateCatalogStateRecord {
  pinned_template_ids: string[];
  recent_template_ids: string[];
  deployment_count_by_template: Record<string, number>;
  updated_at?: string | null;
}

interface DeployDraft {
  name: string;
  replicas: number;
  model: string;
  workspace: string;
  skills: string;
  enabledChannels: string[];
}

interface CustomTemplateForm {
  id: string;
  name: string;
  summary: string;
  description: string;
  starterPrompt: string;
  systemPrompt: string;
  category: string;
  tags: string;
  version: string;
}

function sourceLabel(templateId: string) {
  return templateId === "personal_assistant" ? "official" : "imported";
}

function buildDraft(template: TemplateRecord): DeployDraft {
  const config = template.default_config || {};
  const channels = Object.entries(config.channels || {})
    .filter(([, value]) => Boolean(value?.enabled))
    .map(([key]) => key);

  return {
    name: template.name,
    replicas: 1,
    model: String(config.model || "openai/gpt-5"),
    workspace: String(config.workspace || ""),
    skills: Array.isArray(config.skills) ? config.skills.join(", ") : "",
    enabledChannels: channels,
  };
}

function buildCustomTemplateForm(template: TemplateRecord | null): CustomTemplateForm {
  return {
    id: template?.id || "",
    name: template?.name || "",
    summary: template?.summary || "",
    description: template?.description || "",
    starterPrompt: template?.starter_prompt || "",
    systemPrompt: String(template?.default_config?.system_prompt || ""),
    category: template?.category || "custom",
    tags: (template?.tags || []).join(", "),
    version: template?.version || "1",
  };
}

export function TemplateCatalogPageClient() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<TemplateSourceFilter>("all");
  const [pinnedTemplateIds, setPinnedTemplateIds] = useState<string[]>([]);
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);
  const [deploymentCounts, setDeploymentCounts] = useState<Record<string, number>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("personal_assistant");
  const [drafts, setDrafts] = useState<Record<string, DeployDraft>>({});
  const [customForm, setCustomForm] = useState<CustomTemplateForm>(buildCustomTemplateForm(null));
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [savingCustomId, setSavingCustomId] = useState<string | null>(null);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<DeploymentReceipt | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [templatesResponse, stateResponse] = await Promise.all([
        fetch("/api/dashboard/templates", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/dashboard/templates/state", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const payload = await templatesResponse.json().catch(() => []);
      if (!templatesResponse.ok) {
        throw new Error(
          typeof payload?.detail === "string" ? payload.detail : "Failed to load starter templates",
        );
      }

      const statePayload = await stateResponse.json().catch(() => ({}));
      if (!stateResponse.ok) {
        throw new Error(
          typeof statePayload?.detail === "string"
            ? statePayload.detail
            : "Failed to load template catalog state",
        );
      }

      const nextTemplates = Array.isArray(payload)
        ? (payload.filter((entry) => entry && typeof entry === "object") as TemplateRecord[])
        : [];
      const nextState = statePayload as TemplateCatalogStateRecord;

      setTemplates(nextTemplates);
      setPinnedTemplateIds(Array.isArray(nextState.pinned_template_ids) ? nextState.pinned_template_ids : []);
      setRecentTemplateIds(Array.isArray(nextState.recent_template_ids) ? nextState.recent_template_ids : []);
      setDeploymentCounts(nextState.deployment_count_by_template || {});
      setDrafts((current) => {
        const next = { ...current };
        for (const template of nextTemplates) {
          if (!next[template.id]) {
            next[template.id] = buildDraft(template);
          }
        }
        return next;
      });
      if (!nextTemplates.some((template) => template.id === selectedTemplateId) && nextTemplates[0]?.id) {
        setSelectedTemplateId(nextTemplates[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load starter templates");
    } finally {
      setLoading(false);
    }
  }, [selectedTemplateId]);

  const persistCatalogState = useCallback(
    async (nextState: TemplateCatalogStateRecord) => {
      const response = await fetch("/api/dashboard/templates/state", {
        method: "PUT",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pinned_template_ids: nextState.pinned_template_ids,
          recent_template_ids: nextState.recent_template_ids,
          deployment_count_by_template: nextState.deployment_count_by_template,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          typeof payload?.detail === "string"
            ? payload.detail
            : "Failed to persist template catalog state",
        );
      }
    },
    [],
  );

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...templates]
      .filter((template) => {
        if (sourceFilter === "official") return template.id === "personal_assistant";
        if (sourceFilter === "imported") return template.id !== "personal_assistant";
        return true;
      })
      .filter((template) => {
        if (!needle) return true;
        return [template.id, template.name, template.summary, template.description, template.starter_prompt]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((left, right) => {
        const leftPinned = pinnedTemplateIds.includes(left.id);
        const rightPinned = pinnedTemplateIds.includes(right.id);
        if (leftPinned && !rightPinned) return -1;
        if (!leftPinned && rightPinned) return 1;

        const leftRecentRank = recentTemplateIds.indexOf(left.id);
        const rightRecentRank = recentTemplateIds.indexOf(right.id);
        if (leftRecentRank !== rightRecentRank) {
          if (leftRecentRank === -1) return 1;
          if (rightRecentRank === -1) return -1;
          return leftRecentRank - rightRecentRank;
        }

        const leftCount = deploymentCounts[left.id] || 0;
        const rightCount = deploymentCounts[right.id] || 0;
        if (leftCount !== rightCount) return rightCount - leftCount;
        if (left.is_official && !right.is_official) return -1;
        if (!left.is_official && right.is_official) return 1;
        return left.name.localeCompare(right.name);
      });
  }, [deploymentCounts, pinnedTemplateIds, recentTemplateIds, search, sourceFilter, templates]);

  const selectedTemplate =
    filteredTemplates.find((template) => template.id === selectedTemplateId) ||
    templates.find((template) => template.id === selectedTemplateId) ||
    filteredTemplates[0] ||
    templates[0] ||
    null;

  const selectedDraft = selectedTemplate ? drafts[selectedTemplate.id] || buildDraft(selectedTemplate) : null;
  const selectedTemplateIsCustom = selectedTemplate?.category === "custom";
  const selectedEnabledChannels = selectedDraft?.enabledChannels || [];
  const selectedFiles = selectedTemplate?.default_config?.metadata?.template?.files || [];
  const selectedSourcePath =
    selectedTemplate?.source_path || selectedTemplate?.default_config?.metadata?.template?.source || null;
  const selectedTags = selectedTemplate?.tags || [];
  const selectedSkills = (selectedDraft?.skills || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const importedCount = templates.filter((template) => !template.is_official).length;
  const recommendedTemplateIds = filteredTemplates.slice(0, 3).map((template) => template.id);

  useEffect(() => {
    setCustomForm(buildCustomTemplateForm(selectedTemplate));
  }, [selectedTemplate]);

  async function togglePinned(templateId: string) {
    const nextPinned = pinnedTemplateIds.includes(templateId)
      ? pinnedTemplateIds.filter((entry) => entry !== templateId)
      : [templateId, ...pinnedTemplateIds];
    setPinnedTemplateIds(nextPinned);
    try {
      await persistCatalogState({
        pinned_template_ids: nextPinned,
        recent_template_ids: recentTemplateIds,
        deployment_count_by_template: deploymentCounts,
      });
    } catch (persistError) {
      setDeployError(
        persistError instanceof Error ? persistError.message : "Failed to persist template favorites",
      );
    }
  }

  function setDraft(templateId: string, updates: Partial<DeployDraft>) {
    setDrafts((current) => {
      const baseTemplate = templates.find((template) => template.id === templateId);
      const existing = current[templateId] || (baseTemplate ? buildDraft(baseTemplate) : undefined);
      if (!existing) {
        return current;
      }
      return {
        ...current,
        [templateId]: {
          ...existing,
          ...updates,
        },
      };
    });
  }

  function updateCustomForm(updates: Partial<CustomTemplateForm>) {
    setCustomForm((current) => ({ ...current, ...updates }));
  }

  async function createBlankCustomTemplate() {
    const nextId = `custom-${Date.now()}`.slice(0, 120);
    const payload = {
      id: nextId,
      name: "New Custom Template",
      summary: "Editable custom starter template.",
      description: "User-owned custom template.",
      starter_prompt: "Deploy the custom template and continue from the MUTX operator surface.",
      system_prompt: "You are a custom MUTX assistant template. Operate safely and concisely.",
      category: "custom",
      tags: ["custom"],
      version: "1",
      metadata: { kind: "custom_template", files: [] },
    };

    setSavingCustomId(nextId);
    setDeployError(null);
    try {
      const response = await fetch("/api/dashboard/templates/custom", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof created?.detail === "string" ? created.detail : "Failed to create custom template");
      }
      await loadTemplates();
      setSelectedTemplateId(String(created.id || nextId));
    } catch (creationError) {
      setDeployError(
        creationError instanceof Error ? creationError.message : "Failed to create custom template",
      );
    } finally {
      setSavingCustomId(null);
    }
  }

  async function cloneTemplate(template: TemplateRecord) {
    const nextId = `${template.id}-custom`.slice(0, 120);
    const nextName = `${template.name} Custom`.slice(0, 255);
    setCloningId(template.id);
    setDeployError(null);
    try {
      const response = await fetch(`/api/dashboard/templates/${template.id}/clone`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: nextId,
          name: nextName,
          category: "custom",
          version: "1",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.detail === "string" ? payload.detail : "Failed to clone template");
      }
      await loadTemplates();
      setSelectedTemplateId(String(payload.id || nextId));
    } catch (cloneError) {
      setDeployError(cloneError instanceof Error ? cloneError.message : "Failed to clone template");
    } finally {
      setCloningId(null);
    }
  }

  async function saveCustomTemplate(template: TemplateRecord) {
    if (!selectedTemplateIsCustom) return;
    setSavingCustomId(template.id);
    setDeployError(null);
    try {
      const response = await fetch(`/api/dashboard/templates/custom/${template.id}`, {
        method: "PUT",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customForm.name,
          summary: customForm.summary,
          description: customForm.description,
          starter_prompt: customForm.starterPrompt,
          system_prompt: customForm.systemPrompt,
          category: customForm.category,
          tags: customForm.tags.split(",").map((item) => item.trim()).filter(Boolean),
          version: customForm.version,
          source_path: selectedSourcePath,
          metadata: {
            kind: "custom_template",
            files: selectedFiles,
            source_template_id:
              selectedTemplate.default_config?.metadata?.template?.source_template_id || null,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload?.detail === "string" ? payload.detail : "Failed to save custom template");
      }
      await loadTemplates();
      setSelectedTemplateId(template.id);
    } catch (saveError) {
      setDeployError(saveError instanceof Error ? saveError.message : "Failed to save custom template");
    } finally {
      setSavingCustomId(null);
    }
  }

  async function deleteCustomTemplateAction(template: TemplateRecord) {
    if (!selectedTemplateIsCustom) return;
    setDeletingCustomId(template.id);
    setDeployError(null);
    try {
      const response = await fetch(`/api/dashboard/templates/custom/${template.id}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(typeof payload?.detail === "string" ? payload.detail : "Failed to delete custom template");
      }
      await loadTemplates();
      setSelectedTemplateId("personal_assistant");
    } catch (deleteError) {
      setDeployError(deleteError instanceof Error ? deleteError.message : "Failed to delete custom template");
    } finally {
      setDeletingCustomId(null);
    }
  }

  async function deployTemplate(template: TemplateRecord) {
    const draft = drafts[template.id] || buildDraft(template);
    const name = draft.name.trim();
    if (!name) {
      setDeployError("Assistant name is required before deployment.");
      return;
    }

    const skills = draft.skills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const defaultChannels = template.default_config?.channels || {};
    const channels = Object.fromEntries(
      Object.entries(defaultChannels)
        .filter(([channelId]) => draft.enabledChannels.includes(channelId))
        .map(([channelId, payload]) => [
          channelId,
          {
            label: payload.label || channelId,
            enabled: true,
            mode: payload.mode || "pairing",
            allow_from: payload.allow_from || [],
          },
        ]),
    );

    setDeployingId(template.id);
    setDeployError(null);
    setReceipt(null);
    try {
      const response = await fetch(`/api/dashboard/templates/${template.id}/deploy`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          replicas: draft.replicas,
          model: draft.model.trim() || undefined,
          workspace: draft.workspace.trim() || undefined,
          skills,
          channels,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.detail === "string" ? payload.detail : "Failed to deploy starter template",
        );
      }

      const nextRecent = [template.id, ...recentTemplateIds.filter((entry) => entry !== template.id)].slice(0, 24);
      const nextCounts = {
        ...deploymentCounts,
        [template.id]: (deploymentCounts[template.id] || 0) + 1,
      };
      setRecentTemplateIds(nextRecent);
      setDeploymentCounts(nextCounts);
      await persistCatalogState({
        pinned_template_ids: pinnedTemplateIds,
        recent_template_ids: nextRecent,
        deployment_count_by_template: nextCounts,
      });
      setReceipt({
        templateId: template.id,
        agentId: String(payload?.agent?.id || ""),
        deploymentId: String(payload?.deployment?.id || ""),
      });
    } catch (deploymentError) {
      setDeployError(
        deploymentError instanceof Error
          ? deploymentError.message
          : "Failed to deploy starter template",
      );
      void loadTemplates();
    } finally {
      setDeployingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <RouteHeader
        title="Spawn Lab"
        description="Live starter-template catalog plus a deploy workbench for agent launch, workspace naming, and runtime presets."
        icon={Sparkles}
        badge="starter templates"
        hint={{
          tone: "beta",
          detail:
            "Spawn Lab is functional, but template deployment and custom-template editing are still being hardened. Expect a working operator workbench, not a frozen product contract.",
        }}
        stats={[
          { label: "Catalog", value: String(templates.length) },
          { label: "Imported", value: String(importedCount), tone: "success" },
          { label: "Pinned", value: String(pinnedTemplateIds.length) },
          { label: "Workbench", value: "Live deploy", tone: "success" },
        ]}
      />

      <div
        className="rounded-[24px] border p-4"
        style={{ borderColor: dashboardTokens.borderSubtle, background: dashboardTokens.panelGradient }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search template name, id, prompt, or description"
              aria-label="Search templates"
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FeatureHint
              tone="beta"
              detail="Spawn Lab actions are active, but template deployment, cloning, and custom editing are still an operator beta."
            />
            {(["all", "official", "imported"] as TemplateSourceFilter[]).map((filter) => {
              const active = sourceFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSourceFilter(filter)}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{
                    borderColor: active ? dashboardTokens.borderStrong : dashboardTokens.borderSubtle,
                    backgroundColor: active ? dashboardTokens.brandSoft : dashboardTokens.bgInset,
                    color: dashboardTokens.textPrimary,
                  }}
                >
                  {filter}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => void loadTemplates()}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                borderColor: dashboardTokens.borderSubtle,
                backgroundColor: dashboardTokens.bgInset,
                color: dashboardTokens.textPrimary,
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void createBlankCustomTemplate()}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                borderColor: dashboardTokens.borderStrong,
                backgroundColor: dashboardTokens.brandSoft,
                color: dashboardTokens.textPrimary,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {savingCustomId && savingCustomId.startsWith("custom-") ? "Creating…" : "New custom"}
            </button>
          </div>
        </div>
      </div>

      {receipt ? (
        <div
          className="rounded-[24px] border p-4"
          style={{ borderColor: dashboardTokens.borderStrong, background: dashboardTokens.panelGradient }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Deployment receipt
              </p>
              <p className="mt-2 text-sm text-white">
                Template {receipt.templateId} deployed into agent {receipt.agentId || "pending"}.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Deployment id: {receipt.deploymentId || "pending orchestration response"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {receipt.agentId ? (
                <Link
                  href={`/dashboard/agents/${receipt.agentId}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white"
                >
                  Open agent
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : null}
              <Link
                href={`/onboarding?template=${encodeURIComponent(receipt.templateId)}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white"
              >
                Open onboarding
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {deployError ? (
        <div className="rounded-[20px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {deployError}
        </div>
      ) : null}

      {error ? <EmptyState title="Template catalog unavailable" message={error} /> : null}

      {!error && !loading && filteredTemplates.length === 0 ? (
        <EmptyState
          title="No starter templates matched"
          message="Adjust the search or source filter. MUTX only shows templates backed by the live control plane."
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="space-y-4">
          {filteredTemplates.map((template) => {
            const imported = !template.is_official;
            const pinned = pinnedTemplateIds.includes(template.id);
            const recommended = recommendedTemplateIds.includes(template.id);
            const recentRank = recentTemplateIds.indexOf(template.id);
            const active = template.id === selectedTemplate?.id;
            const config = template.default_config || {};
            const configuredSkillCount = Array.isArray(config.skills) ? config.skills.length : 0;
            const configuredChannelCount = Object.values(config.channels || {}).filter((entry) => entry?.enabled)
              .length;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className="w-full rounded-[24px] border p-5 text-left transition"
                style={{
                  borderColor: active ? dashboardTokens.borderStrong : dashboardTokens.borderSubtle,
                  background: active ? dashboardTokens.panelGradientStrong : dashboardTokens.panelGradient,
                  boxShadow: active ? dashboardTokens.shadowLg : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-200">
                        <Bot className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-white">{template.name}</p>
                          {template.version ? (
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                              v{template.version}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500">{template.id}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{template.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recommended ? (
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200">
                          recommended
                        </span>
                      ) : null}
                      {recentRank !== -1 ? (
                        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                          recent #{recentRank + 1}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                        {template.category || "assistant"}
                      </span>
                      {(template.tags || []).slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        togglePinned(template.id);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300"
                      aria-label={pinned ? `Unpin ${template.name}` : `Pin ${template.name}`}
                    >
                      <Star className={`h-4 w-4 ${pinned ? "fill-current text-amber-300" : ""}`} />
                    </button>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{
                        borderColor: imported ? "rgba(34,211,238,0.25)" : "rgba(251,191,36,0.25)",
                        backgroundColor: imported ? "rgba(34,211,238,0.1)" : "rgba(251,191,36,0.1)",
                        color: imported ? "rgb(165,243,252)" : "rgb(253,230,138)",
                      }}
                    >
                      {sourceLabel(template.id)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-400">{template.description}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Skills</p>
                    <p className="mt-2 text-sm font-semibold text-white">{configuredSkillCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Channels</p>
                    <p className="mt-2 text-sm font-semibold text-white">{configuredChannelCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Preset model</p>
                    <p className="mt-2 truncate text-sm font-semibold text-white">{config.model || "openai/gpt-5"}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedTemplate && selectedDraft ? (
          <aside
            className="rounded-[24px] border p-5"
            style={{ borderColor: dashboardTokens.borderSubtle, background: dashboardTokens.panelGradientStrong }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Deployment workbench
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">{selectedTemplate.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{selectedTemplate.description}</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                {selectedTemplate.id}
              </span>
            </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Layers3 className="h-4 w-4" />
                    <span className="text-[10px] uppercase tracking-[0.18em]">Source</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{sourceLabel(selectedTemplate.id)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="text-[10px] uppercase tracking-[0.18em]">Files</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{selectedFiles.length || 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Gauge className="h-4 w-4" />
                    <span className="text-[10px] uppercase tracking-[0.18em]">Preset</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{selectedDraft.model || "openai/gpt-5"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Tags className="h-4 w-4" />
                    <span className="text-[10px] uppercase tracking-[0.18em]">Version</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{selectedTemplate.version || "unversioned"}</p>
                </div>
              </div>

            <div className="mt-5 rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Starter prompt</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                  {selectedTemplate.validation_status || "healthy"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{selectedTemplate.starter_prompt}</p>
              {selectedTemplate.validation_message ? (
                <p className="mt-3 text-xs text-amber-200">{selectedTemplate.validation_message}</p>
              ) : null}
            </div>

            {selectedTemplateIsCustom ? (
              <div className="mt-5 space-y-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Custom template editor</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Template id</label>
                    <input value={customForm.id} disabled className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-400" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Version</label>
                    <input value={customForm.version} onChange={(event) => updateCustomForm({ version: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Template name</label>
                  <input value={customForm.name} onChange={(event) => updateCustomForm({ name: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</label>
                  <input value={customForm.summary} onChange={(event) => updateCustomForm({ summary: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Description</label>
                  <textarea value={customForm.description} onChange={(event) => updateCustomForm({ description: event.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Starter prompt</label>
                  <textarea value={customForm.starterPrompt} onChange={(event) => updateCustomForm({ starterPrompt: event.target.value })} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">System prompt</label>
                  <textarea value={customForm.systemPrompt} onChange={(event) => updateCustomForm({ systemPrompt: event.target.value })} rows={8} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Category</label>
                    <input value={customForm.category} onChange={(event) => updateCustomForm({ category: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tags</label>
                    <input value={customForm.tags} onChange={(event) => updateCustomForm({ tags: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Assistant name
                </label>
                <input
                  value={selectedDraft.name}
                  onChange={(event) => setDraft(selectedTemplate.id, { name: event.target.value })}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Model override
                  </label>
                  <input
                    value={selectedDraft.model}
                    onChange={(event) => setDraft(selectedTemplate.id, { model: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Replicas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selectedDraft.replicas}
                    onChange={(event) =>
                      setDraft(selectedTemplate.id, {
                        replicas: Math.min(10, Math.max(1, Number(event.target.value) || 1)),
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Workspace override
                </label>
                <input
                  value={selectedDraft.workspace}
                  onChange={(event) => setDraft(selectedTemplate.id, { workspace: event.target.value })}
                  placeholder="Use the template default workspace"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Skills (comma separated)
                </label>
                <textarea
                  value={selectedDraft.skills}
                  onChange={(event) => setDraft(selectedTemplate.id, { skills: event.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-600"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Deploying {selectedSkills.length} skill{selectedSkills.length === 1 ? "" : "s"} from this draft.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Enabled channels
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(selectedTemplate.default_config?.channels || {}).map(([channelId, payload]) => {
                    const active = selectedEnabledChannels.includes(channelId);
                    return (
                      <button
                        key={channelId}
                        type="button"
                        onClick={() =>
                          setDraft(selectedTemplate.id, {
                            enabledChannels: active
                              ? selectedEnabledChannels.filter((entry) => entry !== channelId)
                              : [...selectedEnabledChannels, channelId],
                          })
                        }
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                        style={{
                          borderColor: active ? dashboardTokens.borderStrong : dashboardTokens.borderSubtle,
                          backgroundColor: active ? dashboardTokens.brandSoft : dashboardTokens.bgInset,
                          color: dashboardTokens.textPrimary,
                        }}
                      >
                        {payload.label || channelId}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[18px] border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Truthful metadata</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>Template source path: {selectedSourcePath || "built into MUTX"}</p>
                <p>Imported files: {selectedFiles.length > 0 ? selectedFiles.join(", ") : "none reported"}</p>
                <p>Default enabled channels: {selectedEnabledChannels.length > 0 ? selectedEnabledChannels.join(", ") : "none"}</p>
                <p>Category: {selectedTemplate.category || "assistant"}</p>
                <p>Pin status: {pinnedTemplateIds.includes(selectedTemplate.id) ? "pinned" : "not pinned"}</p>
                <p>Deployments from this template: {deploymentCounts[selectedTemplate.id] || 0}</p>
                <p>Recommendation status: {recommendedTemplateIds.includes(selectedTemplate.id) ? "recommended" : "standard"}</p>
              </div>
              {selectedTags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={deployingId === selectedTemplate.id || !selectedDraft.name.trim()}
                onClick={() => void deployTemplate(selectedTemplate)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Rocket className="h-4 w-4" />
                {deployingId === selectedTemplate.id ? "Deploying…" : "Deploy template"}
              </button>
              {selectedTemplateIsCustom ? (
                <>
                  <button
                    type="button"
                    disabled={savingCustomId === selectedTemplate.id || !customForm.name.trim() || !customForm.systemPrompt.trim()}
                    onClick={() => void saveCustomTemplate(selectedTemplate)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {savingCustomId === selectedTemplate.id ? "Saving…" : "Save custom"}
                  </button>
                  <button
                    type="button"
                    disabled={deletingCustomId === selectedTemplate.id}
                    onClick={() => void deleteCustomTemplateAction(selectedTemplate)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Star className="h-4 w-4" />
                    {deletingCustomId === selectedTemplate.id ? "Deleting…" : "Delete custom"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={cloningId === selectedTemplate.id}
                  onClick={() => void cloneTemplate(selectedTemplate)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Star className="h-4 w-4" />
                  {cloningId === selectedTemplate.id ? "Cloning…" : "Clone as custom"}
                </button>
              )}
              <Link
                href={`/onboarding?template=${encodeURIComponent(selectedTemplate.id)}&name=${encodeURIComponent(selectedDraft.name)}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white"
              >
                Use in onboarding
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
