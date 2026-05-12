{{/*
Nome base do chart
*/}}
{{- define "eks-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Nome completo (release + chart)
*/}}
{{- define "eks-dashboard.fullname" -}}
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
Chart label
*/}}
{{- define "eks-dashboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Labels comuns
*/}}
{{- define "eks-dashboard.labels" -}}
helm.sh/chart: {{ include "eks-dashboard.chart" . }}
{{ include "eks-dashboard.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "eks-dashboard.selectorLabels" -}}
app.kubernetes.io/name: {{ include "eks-dashboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Nome do ServiceAccount
*/}}
{{- define "eks-dashboard.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "eks-dashboard.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Namespace efetivo
*/}}
{{- define "eks-dashboard.namespace" -}}
{{- default .Release.Namespace .Values.namespaceOverride }}
{{- end }}
