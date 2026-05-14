import { useLanguage } from "../context/LanguageContext";

const EKS_VERSIONS = [
  {
    version: "1.27",
    codename: "Chill Vibes",
    releaseDate: "Abr 2023",
    eolDate: "Jul 2024",
    eol: true,
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-1.27",
    changes: {
      pt: [
        "SecureServing habilitado por padrão no kube-scheduler",
        "Auto-deleção de PVCs em StatefulSets (beta)",
        "Acesso a logs de nós via API do Kubernetes (alpha)",
        "Remoção de APIs beta depreciadas (flowcontrol.apiserver.k8s.io/v1beta1 e v1beta2)",
        "MatchLabelKeys em Pod Affinity/Anti-Affinity (alpha)",
      ],
      en: [
        "SecureServing enabled by default in kube-scheduler",
        "StatefulSet PVC auto-deletion (beta)",
        "Node log access via Kubernetes API (alpha)",
        "Removal of deprecated beta APIs (flowcontrol.apiserver.k8s.io/v1beta1 and v1beta2)",
        "MatchLabelKeys in Pod Affinity/Anti-Affinity (alpha)",
      ],
      es: [
        "SecureServing habilitado por defecto en kube-scheduler",
        "Auto-eliminación de PVCs en StatefulSets (beta)",
        "Acceso a logs de nodos vía API de Kubernetes (alpha)",
        "Eliminación de APIs beta obsoletas",
        "MatchLabelKeys en Pod Affinity/Anti-Affinity (alpha)",
      ],
    },
  },
  {
    version: "1.28",
    codename: "Planternetes",
    releaseDate: "Set 2023",
    eolDate: "Nov 2024",
    eol: true,
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-1.28",
    changes: {
      pt: [
        "Sidecar containers introduzidos como recurso nativo do Kubernetes (alpha → beta)",
        "StorageClass padrão retroativo agora estável",
        "Recuperação de nós após shutdown não-gracioso agora estável",
        "Suporte a kubelet com cgroup driver detectado automaticamente do CRI",
        "Proxy de múltiplas versões do servidor API (alpha)",
      ],
      en: [
        "Native sidecar containers introduced (alpha → beta)",
        "Retroactive default StorageClass is now stable",
        "Recovery from non-graceful node shutdown is now stable",
        "Kubelet cgroup driver auto-detected from CRI",
        "Mixed version proxy for API server (alpha)",
      ],
      es: [
        "Sidecar containers nativos introducidos (alpha → beta)",
        "StorageClass por defecto retroactivo ahora estable",
        "Recuperación de nodos tras shutdown no gracioso ahora estable",
        "Detección automática del cgroup driver desde CRI",
        "Proxy de múltiples versiones del API server (alpha)",
      ],
    },
  },
  {
    version: "1.29",
    codename: "Mandala",
    releaseDate: "Jan 2024",
    eolDate: "Mar 2025",
    eol: true,
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-1.29",
    changes: {
      pt: [
        "ReadWriteOncePod para PersistentVolumes agora estável",
        "LoadBalancer IP Mode (beta) — controle sobre como o kube-proxy programa o IP",
        "Consulta de logs de nós via API (beta)",
        "Novo plugin de admissão NodeRestriction aprimorado",
        "KV Separated Cache para melhor desempenho do apiserver (alpha)",
      ],
      en: [
        "ReadWriteOncePod for PersistentVolumes is now stable",
        "LoadBalancer IP Mode (beta) — controls how kube-proxy programs the LB IP",
        "Node log query via API (beta)",
        "Enhanced NodeRestriction admission plugin",
        "KV Separated Cache for better apiserver performance (alpha)",
      ],
      es: [
        "ReadWriteOncePod para PersistentVolumes ahora estable",
        "LoadBalancer IP Mode (beta)",
        "Consulta de logs de nodos vía API (beta)",
        "Plugin de admisión NodeRestriction mejorado",
        "KV Separated Cache para mejor rendimiento del apiserver (alpha)",
      ],
    },
  },
  {
    version: "1.30",
    codename: "Uwubernetes",
    releaseDate: "Mai 2024",
    eolDate: "Jul 2025",
    eol: true,
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-1.30",
    changes: {
      pt: [
        "Suporte a AppArmor agora estável (removido da feature gate)",
        "Registro do horário da última transição de fase de PersistentVolumes agora estável",
        "Configuração de autorização estruturada (beta) — múltiplos webhooks com regras de CEL",
        "Tolerância configurável do HPA agora estável",
        "Eleição de líderes coordenada entre componentes do control plane (alpha)",
      ],
      en: [
        "AppArmor support is now stable (removed from feature gate)",
        "PersistentVolume last phase transition time tracking is now stable",
        "Structured authorization configuration (beta) — multiple webhooks with CEL rules",
        "Configurable HPA tolerance is now stable",
        "Coordinated leader election for control plane components (alpha)",
      ],
      es: [
        "Soporte AppArmor ahora estable",
        "Registro del último tiempo de transición de fase de PersistentVolumes estable",
        "Configuración de autorización estructurada (beta)",
        "Tolerancia configurable del HPA ahora estable",
        "Elección de líder coordinada entre componentes del control plane (alpha)",
      ],
    },
  },
  {
    version: "1.31",
    codename: "Elli",
    releaseDate: "Set 2024",
    eolDate: "Nov 2025",
    eol: true,
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-1.31",
    changes: {
      pt: [
        "Sidecar containers agora estável",
        "Condições de falha de pod agora estável — permite identificar causa exata de falha",
        "Opções de mount de volumes para drivers CSI agora estável",
        "VolumeAttributesClass para modificação de volumes CSI (beta)",
        "Suporte a swap de memória no kubelet (beta) — disponível em nós Linux",
      ],
      en: [
        "Sidecar containers are now stable",
        "Pod failure conditions are now stable — enables exact failure cause identification",
        "CSI volume mount options are now stable",
        "VolumeAttributesClass for CSI volume modification (beta)",
        "Kubelet memory swap support (beta) — available on Linux nodes",
      ],
      es: [
        "Sidecar containers ahora estable",
        "Condiciones de fallo de pod ahora estable",
        "Opciones de mount de volúmenes CSI ahora estable",
        "VolumeAttributesClass para modificación de volúmenes CSI (beta)",
        "Soporte de swap de memoria en kubelet (beta)",
      ],
    },
  },
  {
    version: "1.32",
    codename: "Penelope",
    releaseDate: "Jan 2025",
    eolDate: "Mar 2026",
    eol: true,
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-1.32",
    changes: {
      pt: [
        "Roteamento topológico (Topology Aware Routing) agora estável",
        "Dynamic Resource Allocation (DRA) promovido a beta — alocação de GPUs e aceleradores",
        "ClusterTrustBundle para distribuição de certificados raiz (beta)",
        "Preempção assíncrona no kube-scheduler para melhor throughput (alpha)",
        "Suporte a nomes de usuário longos no kubelet (stable)",
      ],
      en: [
        "Topology Aware Routing is now stable",
        "Dynamic Resource Allocation (DRA) promoted to beta — GPU and accelerator allocation",
        "ClusterTrustBundle for root certificate distribution (beta)",
        "Asynchronous preemption in kube-scheduler for better throughput (alpha)",
        "Long username support in kubelet (stable)",
      ],
      es: [
        "Topology Aware Routing ahora estable",
        "Dynamic Resource Allocation (DRA) promovido a beta",
        "ClusterTrustBundle para distribución de certificados raíz (beta)",
        "Preempción asíncrona en kube-scheduler (alpha)",
        "Soporte de nombres de usuario largos en kubelet (stable)",
      ],
    },
  },
  {
    version: "1.33",
    codename: "Octarine",
    releaseDate: "Abr 2025",
    eolDate: "Jul 2026",
    eol: false,
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-1.33",
    changes: {
      pt: [
        "Redimensionamento de pods in-place agora estável — altera CPU/memória sem reiniciar",
        "Job success policy agora estável — define critérios customizados de sucesso",
        "Recursive Read-Only mounts agora estável — montagens de volumes read-only em cascata",
        "Structured authentication webhooks aprimorados (stable)",
        "Suporte a imagens OCI para init containers e sidecar containers (stable)",
      ],
      en: [
        "In-place pod resize is now stable — change CPU/memory without restarting",
        "Job success policy is now stable — custom success criteria for Jobs",
        "Recursive Read-Only mounts are now stable — cascading read-only volume mounts",
        "Structured authentication webhooks (stable)",
        "OCI image support for init containers and sidecar containers (stable)",
      ],
      es: [
        "Redimensionamiento de pods in-place ahora estable",
        "Job success policy ahora estable",
        "Montajes recursivos read-only ahora estable",
        "Webhooks de autenticación estructurada (stable)",
        "Soporte de imágenes OCI para init containers y sidecar containers (stable)",
      ],
    },
  },
  {
    version: "1.34",
    codename: "—",
    releaseDate: "Set 2025",
    eolDate: "Nov 2026",
    eol: false,
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html#kubernetes-1.34",
    changes: {
      pt: [
        "Melhorias no Dynamic Resource Allocation (DRA) — suporte a particionamento de dispositivos",
        "Structured authorization configuration agora estável",
        "Eleição de líderes coordenada agora estável",
        "Aprimoramentos no scheduler — melhor suporte a workloads de IA/ML com GPUs",
        "Informações detalhadas de alocação de recursos nos status de pods",
      ],
      en: [
        "Dynamic Resource Allocation (DRA) improvements — device partitioning support",
        "Structured authorization configuration is now stable",
        "Coordinated leader election is now stable",
        "Scheduler enhancements — better AI/ML workload support with GPUs",
        "Detailed resource allocation info in pod status",
      ],
      es: [
        "Mejoras en Dynamic Resource Allocation (DRA)",
        "Configuración de autorización estructurada ahora estable",
        "Elección de líder coordinada ahora estable",
        "Mejoras en el scheduler para workloads de IA/ML con GPUs",
        "Información detallada de asignación de recursos en el estado de pods",
      ],
    },
  },
];

export function EksVersionsPanel({ currentVersion }) {
  const { t, lang } = useLanguage();

  const filtered = EKS_VERSIONS.filter(v =>
    parseFloat(v.version) >= parseFloat(currentVersion)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
      {filtered.map(v => {
        const isCurrent = v.version === currentVersion;
        const borderColor = isCurrent
          ? "var(--color-text-info)"
          : v.eol
          ? "var(--color-border-tertiary)"
          : "var(--color-border-secondary)";

        return (
          <div key={v.version} style={{
            border: `1px solid ${borderColor}`,
            borderLeft: `3px solid ${borderColor}`,
            borderRadius: "var(--border-radius-md)",
            padding: "14px 16px",
            background: isCurrent ? "rgba(74,127,212,0.06)" : "var(--color-background-secondary)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: isCurrent ? "var(--color-text-info)" : "var(--color-text-primary)",
              }}>
                EKS {v.version}
              </span>

              {v.codename !== "—" && (
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                  "{v.codename}"
                </span>
              )}

              {isCurrent && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  borderRadius: 10, background: "rgba(74,127,212,0.18)",
                  color: "var(--color-text-info)", letterSpacing: "0.05em",
                }}>
                  {t("currentVersion")}
                </span>
              )}

              {v.eol && !isCurrent && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  borderRadius: 10, background: "var(--color-background-danger)",
                  color: "var(--color-text-danger)",
                }}>
                  EOL
                </span>
              )}

              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
                {v.releaseDate} → EOL {v.eolDate}
              </span>
            </div>

            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              {(v.changes[lang] ?? v.changes.pt).map((item, i) => (
                <li key={i} style={{
                  fontSize: 12,
                  color: v.eol
                    ? "var(--color-text-tertiary)"
                    : "var(--color-text-secondary)",
                  lineHeight: 1.5,
                }}>
                  {item}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 10 }}>
              <a href={v.docUrl} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 11, color: "var(--color-text-info)",
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                AWS Docs
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
