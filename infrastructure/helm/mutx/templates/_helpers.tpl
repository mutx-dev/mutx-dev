{{/*
Expand the name of the chart.
*/}}
{{- define "mutx.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "mutx.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart name and version as used by the chart label.
*/}}
{{- define "mutx.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "mutx.labels" -}}
helm.sh/chart: {{ include "mutx.chart" . }}
{{ include "mutx.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels (used in matchLabels and service selectors).
*/}}
{{- define "mutx.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mutx.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
API component labels.
*/}}
{{- define "mutx-api.labels" -}}
{{ include "mutx.labels" . }}
app.kubernetes.io/component: api
{{- end }}

{{- define "mutx-api.selectorLabels" -}}
{{ include "mutx.selectorLabels" . }}
app.kubernetes.io/component: api
{{- end }}

{{/*
Web component labels.
*/}}
{{- define "mutx-web.labels" -}}
{{ include "mutx.labels" . }}
app.kubernetes.io/component: web
{{- end }}

{{- define "mutx-web.selectorLabels" -}}
{{ include "mutx.selectorLabels" . }}
app.kubernetes.io/component: web
{{- end }}

{{/*
OTel Collector component labels.
*/}}
{{- define "mutx-otel-collector.labels" -}}
{{ include "mutx.labels" . }}
app.kubernetes.io/component: otel-collector
{{- end }}

{{- define "mutx-otel-collector.selectorLabels" -}}
{{ include "mutx.selectorLabels" . }}
app.kubernetes.io/component: otel-collector
{{- end }}

{{/*
Redis component labels.
*/}}
{{- define "mutx-redis.labels" -}}
{{ include "mutx.labels" . }}
app.kubernetes.io/component: redis
{{- end }}

{{- define "mutx-redis.selectorLabels" -}}
{{ include "mutx.selectorLabels" . }}
app.kubernetes.io/component: redis
{{- end }}

{{/*
PostgreSQL component labels.
*/}}
{{- define "mutx-postgres.labels" -}}
{{ include "mutx.labels" . }}
app.kubernetes.io/component: postgres
{{- end }}

{{- define "mutx-postgres.selectorLabels" -}}
{{ include "mutx.selectorLabels" . }}
app.kubernetes.io/component: postgres
{{- end }}

{{/*
Resolve image tag: uses global override, then component-specific, then Chart.AppVersion.
*/}}
{{- define "mutx.imageTag" -}}
{{- .Values.global.imageTag | default .Chart.AppVersion }}
{{- end }}

{{/*
Service account name.
*/}}
{{- define "mutx.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "mutx.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
