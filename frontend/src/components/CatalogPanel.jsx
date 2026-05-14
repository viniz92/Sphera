import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const CATALOG = [
  // Rede
  {
    id: "cilium",
    name: "Cilium",
    category: "Rede",
    description: "CNI baseado em eBPF que oferece rede, segurança e observabilidade de alto desempenho para workloads Kubernetes. Suporta políticas de rede L3/L4/L7 e substituição do kube-proxy.",
    maintainer: "CNCF / Isovalent",
    docUrl: "https://docs.cilium.io",
    githubUrl: "https://github.com/cilium/cilium",
    tags: ["cni", "ebpf", "networking", "security", "observability"],
  },
  {
    id: "calico",
    name: "Calico",
    category: "Rede",
    description: "Solução de rede e segurança open-source para Kubernetes com suporte a BGP, políticas de rede avançadas e integração com clouds públicas.",
    maintainer: "Tigera",
    docUrl: "https://docs.tigera.io/calico/latest",
    githubUrl: "https://github.com/projectcalico/calico",
    tags: ["cni", "bgp", "networking", "network-policy"],
  },
  {
    id: "flannel",
    name: "Flannel",
    category: "Rede",
    description: "Plugin CNI simples e leve para Kubernetes que provisiona uma rede de overlay usando VXLAN ou outros backends. Ideal para clusters menores que precisam de rede básica.",
    maintainer: "CoreOS / Flannel community",
    docUrl: "https://github.com/flannel-io/flannel#readme",
    githubUrl: "https://github.com/flannel-io/flannel",
    tags: ["cni", "vxlan", "overlay", "networking"],
  },

  // Ingress
  {
    id: "traefik",
    name: "Traefik",
    category: "Ingress",
    description: "Proxy reverso e load balancer moderno com descoberta automática de serviços, suporte a Let's Encrypt e dashboard integrado. Suporta TCP, UDP e HTTP/2.",
    maintainer: "Traefik Labs",
    docUrl: "https://doc.traefik.io/traefik",
    githubUrl: "https://github.com/traefik/traefik",
    tags: ["ingress", "reverse-proxy", "load-balancer", "tls", "lets-encrypt"],
  },
  {
    id: "contour",
    name: "Contour",
    category: "Ingress",
    description: "Ingress controller para Kubernetes baseado no Envoy proxy, com suporte a HTTPProxy (CRD) para roteamento avançado e controle de tráfego sofisticado.",
    maintainer: "CNCF / VMware",
    docUrl: "https://projectcontour.io/docs",
    githubUrl: "https://github.com/projectcontour/contour",
    tags: ["ingress", "envoy", "httpproxy", "tls"],
  },
  {
    id: "haproxy-ingress",
    name: "HAProxy Ingress",
    category: "Ingress",
    description: "Ingress controller baseado no HAProxy, com foco em alta performance e alta disponibilidade. Oferece configuração granular via annotations e ConfigMap.",
    maintainer: "HAProxy Technologies",
    docUrl: "https://haproxy-ingress.github.io/docs",
    githubUrl: "https://github.com/jcmoraisjr/haproxy-ingress",
    tags: ["ingress", "haproxy", "load-balancer", "high-availability"],
  },

  // Service Mesh
  {
    id: "istio",
    name: "Istio",
    category: "Service Mesh",
    description: "Service mesh completo que oferece gerenciamento de tráfego, observabilidade, segurança mTLS e políticas de acesso entre microserviços sem alterar o código da aplicação.",
    maintainer: "CNCF / Google / IBM",
    docUrl: "https://istio.io/latest/docs",
    githubUrl: "https://github.com/istio/istio",
    tags: ["service-mesh", "mtls", "traffic-management", "observability", "envoy"],
  },
  {
    id: "linkerd",
    name: "Linkerd",
    category: "Service Mesh",
    description: "Service mesh ultra-leve para Kubernetes focado em simplicidade, segurança mTLS automática e observabilidade com overhead mínimo.",
    maintainer: "CNCF / Buoyant",
    docUrl: "https://linkerd.io/2.x/overview",
    githubUrl: "https://github.com/linkerd/linkerd2",
    tags: ["service-mesh", "mtls", "lightweight", "observability"],
  },

  // Observabilidade
  {
    id: "opentelemetry-collector",
    name: "OpenTelemetry Collector",
    category: "Observabilidade",
    description: "Pipeline vendor-neutral para coleta, processamento e exportação de traces, métricas e logs. Suporta dezenas de backends como Jaeger, Prometheus, Datadog e outros.",
    maintainer: "CNCF / OpenTelemetry",
    docUrl: "https://opentelemetry.io/docs/collector",
    githubUrl: "https://github.com/open-telemetry/opentelemetry-collector",
    tags: ["observability", "tracing", "metrics", "logs", "otel"],
  },
  {
    id: "loki",
    name: "Loki",
    category: "Observabilidade",
    description: "Sistema de agregação de logs horizontalmente escalável e altamente disponível, inspirado no Prometheus. Indexa apenas metadados (labels) em vez do conteúdo completo dos logs.",
    maintainer: "Grafana Labs",
    docUrl: "https://grafana.com/docs/loki/latest",
    githubUrl: "https://github.com/grafana/loki",
    tags: ["logging", "observability", "grafana", "promtail"],
  },
  {
    id: "tempo",
    name: "Tempo",
    category: "Observabilidade",
    description: "Backend de tracing distribuído de alta escala e baixo custo da Grafana Labs. Armazena traces em object storage e integra nativamente com Grafana, Loki e Prometheus.",
    maintainer: "Grafana Labs",
    docUrl: "https://grafana.com/docs/tempo/latest",
    githubUrl: "https://github.com/grafana/tempo",
    tags: ["tracing", "observability", "grafana", "jaeger", "zipkin"],
  },
  {
    id: "victoriametrics",
    name: "VictoriaMetrics",
    category: "Observabilidade",
    description: "Banco de dados de séries temporais de alto desempenho compatível com Prometheus. Oferece ingestão e consulta rápidas com compressão superior e baixo uso de recursos.",
    maintainer: "VictoriaMetrics",
    docUrl: "https://docs.victoriametrics.com",
    githubUrl: "https://github.com/VictoriaMetrics/VictoriaMetrics",
    tags: ["metrics", "prometheus", "tsdb", "observability"],
  },
  {
    id: "pixie",
    name: "Pixie",
    category: "Observabilidade",
    description: "Plataforma de observabilidade para Kubernetes usando eBPF para capturar automaticamente traces, métricas e logs sem instrumentação manual das aplicações.",
    maintainer: "CNCF / New Relic",
    docUrl: "https://docs.px.dev",
    githubUrl: "https://github.com/pixie-io/pixie",
    tags: ["observability", "ebpf", "auto-instrumentation", "tracing"],
  },

  // Segurança
  {
    id: "falco",
    name: "Falco",
    category: "Segurança",
    description: "Runtime security engine para Kubernetes baseado em eBPF/kernel module que detecta comportamentos anômalos em containers e syscalls suspeitas em tempo real.",
    maintainer: "CNCF / Sysdig",
    docUrl: "https://falco.org/docs",
    githubUrl: "https://github.com/falcosecurity/falco",
    tags: ["security", "runtime", "ebpf", "threat-detection", "syscall"],
  },
  {
    id: "kyverno",
    name: "Kyverno",
    category: "Segurança",
    description: "Policy engine nativo para Kubernetes que valida, muta e gera recursos usando políticas expressas como recursos Kubernetes (YAML), sem necessidade de Rego ou linguagem customizada.",
    maintainer: "CNCF / Nirmata",
    docUrl: "https://kyverno.io/docs",
    githubUrl: "https://github.com/kyverno/kyverno",
    tags: ["policy", "security", "admission-control", "governance"],
  },
  {
    id: "opa-gatekeeper",
    name: "OPA Gatekeeper",
    category: "Segurança",
    description: "Admission controller baseado no Open Policy Agent (OPA) que permite definir e aplicar políticas customizáveis para recursos Kubernetes usando a linguagem Rego.",
    maintainer: "CNCF / OPA community",
    docUrl: "https://open-policy-agent.github.io/gatekeeper/website/docs",
    githubUrl: "https://github.com/open-policy-agent/gatekeeper",
    tags: ["policy", "opa", "rego", "admission-control", "security"],
  },
  {
    id: "trivy-operator",
    name: "Trivy Operator",
    category: "Segurança",
    description: "Operator que integra o scanner de vulnerabilidades Trivy ao Kubernetes, gerando relatórios contínuos de vulnerabilidades em imagens, configurações e segredos.",
    maintainer: "Aqua Security",
    docUrl: "https://aquasecurity.github.io/trivy-operator/latest",
    githubUrl: "https://github.com/aquasecurity/trivy-operator",
    tags: ["security", "vulnerability-scanning", "cve", "images", "sbom"],
  },
  {
    id: "tetragon",
    name: "Tetragon",
    category: "Segurança",
    description: "Plataforma de security observability e enforcement baseada em eBPF da Cilium. Permite políticas de segurança em tempo real ao nível de syscall e processo.",
    maintainer: "Isovalent / Cilium",
    docUrl: "https://tetragon.io/docs",
    githubUrl: "https://github.com/cilium/tetragon",
    tags: ["security", "ebpf", "runtime", "enforcement", "cilium"],
  },

  // Storage
  {
    id: "longhorn",
    name: "Longhorn",
    category: "Storage",
    description: "Sistema de armazenamento em bloco distribuído e cloud-native para Kubernetes, com suporte a snapshots, backups incrementais e replicação de volumes entre nós.",
    maintainer: "CNCF / SUSE",
    docUrl: "https://longhorn.io/docs",
    githubUrl: "https://github.com/longhorn/longhorn",
    tags: ["storage", "block", "distributed", "snapshots", "backup"],
  },
  {
    id: "rook-ceph",
    name: "Rook-Ceph",
    category: "Storage",
    description: "Operator que transforma o Ceph em storage cloud-native autogerenciado para Kubernetes, oferecendo object storage, block storage e filesystem distribuído.",
    maintainer: "CNCF / Rook community",
    docUrl: "https://rook.io/docs/rook/latest-release",
    githubUrl: "https://github.com/rook/rook",
    tags: ["storage", "ceph", "object-storage", "block", "distributed"],
  },
  {
    id: "openebs",
    name: "OpenEBS",
    category: "Storage",
    description: "Solução de container attached storage (CAS) que usa os nós do cluster para prover volumes persistentes com diferentes engines: Mayastor, LocalPV e outros.",
    maintainer: "CNCF / DataCore",
    docUrl: "https://openebs.io/docs",
    githubUrl: "https://github.com/openebs/openebs",
    tags: ["storage", "cas", "local-pv", "mayastor", "persistent-volume"],
  },

  // GitOps / CD
  {
    id: "fluxcd",
    name: "FluxCD",
    category: "GitOps / CD",
    description: "Conjunto de controllers GitOps para Kubernetes que mantém o estado do cluster sincronizado com repositórios Git, Helm charts e OCI registries de forma contínua.",
    maintainer: "CNCF / Flux community",
    docUrl: "https://fluxcd.io/flux",
    githubUrl: "https://github.com/fluxcd/flux2",
    tags: ["gitops", "cd", "helm", "kustomize", "continuous-delivery"],
  },
  {
    id: "tekton",
    name: "Tekton",
    category: "GitOps / CD",
    description: "Framework cloud-native para construir pipelines de CI/CD diretamente no Kubernetes. Define pipelines como CRDs (Tasks, Pipelines, Runs) nativos do cluster.",
    maintainer: "CNCF / CD Foundation",
    docUrl: "https://tekton.dev/docs",
    githubUrl: "https://github.com/tektoncd/pipeline",
    tags: ["ci", "cd", "pipeline", "gitops", "build"],
  },

  // Escalabilidade
  {
    id: "vpa",
    name: "VPA (Vertical Pod Autoscaler)",
    category: "Escalabilidade",
    description: "Ajusta automaticamente os requests e limits de CPU e memória dos containers com base no uso histórico, otimizando o consumo de recursos no cluster.",
    maintainer: "Kubernetes / Google",
    docUrl: "https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler#readme",
    githubUrl: "https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler",
    tags: ["autoscaling", "vpa", "resources", "optimization"],
  },
  {
    id: "opencost",
    name: "OpenCost",
    category: "Escalabilidade",
    description: "Solução open-source de monitoramento e alocação de custos para Kubernetes em tempo real. Monitora custos por namespace, deployment, label e muito mais.",
    maintainer: "CNCF / Kubecost",
    docUrl: "https://www.opencost.io/docs",
    githubUrl: "https://github.com/opencost/opencost",
    tags: ["cost", "finops", "monitoring", "allocation"],
  },

  // Secrets
  {
    id: "external-secrets",
    name: "External Secrets Operator",
    category: "Secrets",
    description: "Operator que sincroniza segredos de provedores externos (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager, etc.) como Kubernetes Secrets nativos.",
    maintainer: "External Secrets community",
    docUrl: "https://external-secrets.io/latest",
    githubUrl: "https://github.com/external-secrets/external-secrets",
    tags: ["secrets", "aws", "vault", "security", "sync"],
  },
  {
    id: "vault",
    name: "HashiCorp Vault",
    category: "Secrets",
    description: "Plataforma de gerenciamento de segredos e proteção de dados sensíveis com suporte a PKI, secrets dinâmicos, criptografia como serviço e auditoria.",
    maintainer: "HashiCorp",
    docUrl: "https://developer.hashicorp.com/vault/docs",
    githubUrl: "https://github.com/hashicorp/vault",
    tags: ["secrets", "pki", "encryption", "dynamic-secrets", "audit"],
  },

  // Outros
  {
    id: "crossplane",
    name: "Crossplane",
    category: "Outros",
    description: "Framework que transforma o Kubernetes em uma plataforma universal de infraestrutura como código, permitindo provisionar recursos cloud (AWS, GCP, Azure) como CRDs.",
    maintainer: "CNCF / Upbound",
    docUrl: "https://docs.crossplane.io",
    githubUrl: "https://github.com/crossplane/crossplane",
    tags: ["infrastructure", "iac", "aws", "gcp", "azure", "platform"],
  },
  {
    id: "strimzi",
    name: "Strimzi (Kafka)",
    category: "Outros",
    description: "Operator que simplifica a execução do Apache Kafka no Kubernetes, gerenciando brokers, topics, users, connectors e MirrorMaker com CRDs declarativos.",
    maintainer: "CNCF / Strimzi community",
    docUrl: "https://strimzi.io/documentation",
    githubUrl: "https://github.com/strimzi/strimzi-kafka-operator",
    tags: ["kafka", "messaging", "streaming", "operator", "event-driven"],
  },
  {
    id: "keda",
    name: "KEDA",
    category: "Escalabilidade",
    description: "Kubernetes Event-driven Autoscaling. Escala workloads com base em métricas externas como filas SQS, tópicos Kafka, banco de dados, Prometheus e mais de 60 outras fontes.",
    maintainer: "CNCF",
    docUrl: "https://keda.sh/docs/",
    githubUrl: "https://github.com/kedacore/keda",
    tags: ["autoscaling", "event-driven", "sqs", "kafka", "hpa", "scaling"],
  },
  {
    id: "karpenter",
    name: "Karpenter",
    category: "Escalabilidade",
    description: "Auto-scaler de nós de alta performance para AWS. Provisiona instâncias EC2 em segundos baseado nas necessidades dos pods pendentes, otimizando custo e velocidade.",
    maintainer: "AWS",
    docUrl: "https://karpenter.sh/docs/",
    githubUrl: "https://github.com/aws/karpenter",
    tags: ["autoscaling", "nodes", "ec2", "aws", "cost", "provisioning"],
  },
  {
    id: "argocd",
    name: "ArgoCD",
    category: "GitOps / CD",
    description: "Ferramenta de GitOps para deploy contínuo. Sincroniza automaticamente o estado do cluster Kubernetes com repositórios Git, oferecendo UI visual e rollback simples.",
    maintainer: "CNCF / Argo Project",
    docUrl: "https://argo-cd.readthedocs.io/",
    githubUrl: "https://github.com/argoproj/argo-cd",
    tags: ["gitops", "cd", "deploy", "sync", "git", "argo"],
  },
  {
    id: "argo-workflows",
    name: "Argo Workflows",
    category: "GitOps / CD",
    description: "Motor de workflows para Kubernetes. Executa DAGs e pipelines de CI/CD como pods nativos, com suporte a dependências entre steps, artefatos e templates reutilizáveis.",
    maintainer: "CNCF / Argo Project",
    docUrl: "https://argoproj.github.io/argo-workflows/",
    githubUrl: "https://github.com/argoproj/argo-workflows",
    tags: ["workflow", "pipeline", "dag", "ci", "cd", "argo"],
  },
  {
    id: "cert-manager",
    name: "cert-manager",
    category: "Segurança",
    description: "Gerencia certificados TLS automaticamente no Kubernetes. Integra com Let's Encrypt, HashiCorp Vault, Venafi e outros issuers para provisionar e renovar certificados.",
    maintainer: "CNCF / Jetstack",
    docUrl: "https://cert-manager.io/docs/",
    githubUrl: "https://github.com/cert-manager/cert-manager",
    tags: ["tls", "ssl", "certificates", "letsencrypt", "security"],
  },
  {
    id: "prometheus",
    name: "Prometheus",
    category: "Observabilidade",
    description: "Sistema de monitoramento e alertas time-series. Coleta métricas via scraping HTTP, suporta PromQL para queries e AlertManager para notificações.",
    maintainer: "CNCF",
    docUrl: "https://prometheus.io/docs/",
    githubUrl: "https://github.com/prometheus/prometheus",
    tags: ["monitoring", "metrics", "alerting", "time-series", "promql"],
  },
  {
    id: "grafana",
    name: "Grafana",
    category: "Observabilidade",
    description: "Plataforma de visualização de métricas e dashboards. Integra com Prometheus, CloudWatch, Elasticsearch e dezenas de outras fontes de dados.",
    maintainer: "Grafana Labs",
    docUrl: "https://grafana.com/docs/",
    githubUrl: "https://github.com/grafana/grafana",
    tags: ["dashboards", "visualization", "metrics", "alerting", "observability"],
  },
  {
    id: "jaeger",
    name: "Jaeger",
    category: "Observabilidade",
    description: "Sistema de rastreamento distribuído de ponta a ponta. Monitora transações entre microsserviços, identifica gargalos de latência e dependências de serviços.",
    maintainer: "CNCF / Uber",
    docUrl: "https://www.jaegertracing.io/docs/",
    githubUrl: "https://github.com/jaegertracing/jaeger",
    tags: ["tracing", "distributed-tracing", "observability", "microservices"],
  },
  {
    id: "metrics-server",
    name: "Metrics Server",
    category: "Observabilidade",
    description: "Coleta métricas de CPU e memória dos nós e pods via Kubelet. Necessário para HPA (Horizontal Pod Autoscaler) e para o comando kubectl top.",
    maintainer: "Kubernetes SIG",
    docUrl: "https://github.com/kubernetes-sigs/metrics-server",
    githubUrl: "https://github.com/kubernetes-sigs/metrics-server",
    tags: ["metrics", "hpa", "kubectl-top", "cpu", "memory", "monitoring"],
  },
  {
    id: "aws-load-balancer-controller",
    name: "AWS Load Balancer Controller",
    category: "Ingress",
    description: "Provisiona Application Load Balancers (ALB) e Network Load Balancers (NLB) da AWS automaticamente a partir de recursos Ingress e Service do Kubernetes.",
    maintainer: "AWS",
    docUrl: "https://kubernetes-sigs.github.io/aws-load-balancer-controller/",
    githubUrl: "https://github.com/kubernetes-sigs/aws-load-balancer-controller",
    tags: ["alb", "nlb", "aws", "ingress", "load-balancer", "eks"],
  },
  {
    id: "ingress-nginx",
    name: "ingress-nginx",
    category: "Ingress",
    description: "Controller de Ingress baseado em Nginx para Kubernetes. Gerencia roteamento HTTP/HTTPS para serviços internos com suporte a TLS, rate limiting e autenticação.",
    maintainer: "Kubernetes",
    docUrl: "https://kubernetes.github.io/ingress-nginx/",
    githubUrl: "https://github.com/kubernetes/ingress-nginx",
    tags: ["nginx", "ingress", "http", "https", "routing", "load-balancer"],
  },
  {
    id: "ebs-csi-driver",
    name: "EBS CSI Driver",
    category: "Storage",
    description: "Driver CSI oficial da AWS para volumes EBS. Permite que pods montem e gerenciem volumes EBS como PersistentVolumes com suporte a snapshots e expansão dinâmica.",
    maintainer: "AWS",
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html",
    githubUrl: "https://github.com/kubernetes-sigs/aws-ebs-csi-driver",
    tags: ["ebs", "aws", "storage", "pv", "pvc", "csi", "volumes"],
  },
  {
    id: "external-dns",
    name: "ExternalDNS",
    category: "Outros",
    description: "Sincroniza registros DNS externos com Services e Ingresses do Kubernetes. Suporta Route53, Cloudflare, GCP DNS e muitos outros provedores DNS.",
    maintainer: "Kubernetes SIG",
    docUrl: "https://kubernetes-sigs.github.io/external-dns/",
    githubUrl: "https://github.com/kubernetes-sigs/external-dns",
    tags: ["dns", "route53", "cloudflare", "ingress", "service", "networking"],
  },
  {
    id: "velero",
    name: "Velero",
    category: "Backup / DR",
    description: "Backup e restore de recursos Kubernetes e volumes persistentes. Suporta S3, GCS e outros object storages. Ideal para DR, migração de cluster e compliance.",
    maintainer: "VMware / CNCF",
    docUrl: "https://velero.io/docs/",
    githubUrl: "https://github.com/vmware-tanzu/velero",
    tags: ["backup", "restore", "disaster-recovery", "s3", "migration"],
  },
  {
    id: "sealed-secrets",
    name: "Sealed Secrets",
    category: "Segurança",
    description: "Encripta Secrets do Kubernetes para armazenamento seguro em repositórios Git (GitOps-friendly). Apenas o controller do cluster consegue descriptografar os segredos.",
    maintainer: "Bitnami",
    docUrl: "https://github.com/bitnami-labs/sealed-secrets",
    githubUrl: "https://github.com/bitnami-labs/sealed-secrets",
    tags: ["secrets", "encryption", "gitops", "security", "git"],
  },
  {
    id: "cluster-autoscaler",
    name: "Cluster Autoscaler",
    category: "Escalabilidade",
    description: "Escala automaticamente os node groups do EKS com base na demanda de pods pendentes. Remove nós ociosos e adiciona capacidade quando necessário.",
    maintainer: "Kubernetes SIG",
    docUrl: "https://docs.aws.amazon.com/eks/latest/userguide/autoscaling.html",
    githubUrl: "https://github.com/kubernetes/autoscaler",
    tags: ["autoscaling", "nodes", "ec2", "aws", "eks", "cost"],
  },
  {
    id: "reloader",
    name: "Reloader",
    category: "Operações",
    description: "Reinicia automaticamente Deployments, StatefulSets e DaemonSets quando ConfigMaps ou Secrets relacionados são atualizados. Elimina restarts manuais após mudanças de config.",
    maintainer: "Stakater",
    docUrl: "https://github.com/stakater/Reloader",
    githubUrl: "https://github.com/stakater/Reloader",
    tags: ["configmap", "secret", "restart", "rolling-update", "config"],
  },
  {
    id: "descheduler",
    name: "Descheduler",
    category: "Escalabilidade",
    description: "Remove e reagenda pods mal distribuídos para otimizar a utilização dos nós. Corrige desbalanceamento causado por falhas de nós, scaling ou mudanças de afinidade.",
    maintainer: "Kubernetes SIG",
    docUrl: "https://github.com/kubernetes-sigs/descheduler",
    githubUrl: "https://github.com/kubernetes-sigs/descheduler",
    tags: ["scheduling", "rebalancing", "nodes", "optimization", "affinity"],
  },
];

const ALL_CATEGORIES = [...new Set(CATALOG.map(a => a.category))].sort();

export function CatalogPanel({ addons = [] }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const installedNames = new Set((addons || []).map(a => a.name?.toLowerCase()));

  const filtered = CATALOG.filter(a => {
    const matchCat = activeCategory === "all" || a.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some(tag => tag.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const isInstalled = (addon) =>
    installedNames.has(addon.id.toLowerCase()) || installedNames.has(addon.name.toLowerCase());

  return (
    <div style={{ paddingTop: 4 }}>
      {/* Barra de busca + filtro */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("catalogSearch")}
          style={{
            padding: "6px 12px", fontSize: 12, borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-secondary)",
            background: "var(--color-background-secondary)", color: "var(--color-text-primary)",
            outline: "none", width: 200,
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveCategory("all")}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 12, cursor: "pointer",
              background: activeCategory === "all" ? "rgba(74,127,212,0.2)" : "var(--color-background-secondary)",
              color: activeCategory === "all" ? "var(--color-text-info)" : "var(--color-text-secondary)",
              border: `0.5px solid ${activeCategory === "all" ? "rgba(74,127,212,0.4)" : "var(--color-border-secondary)"}`,
            }}
          >
            {t("catalogAll")} ({CATALOG.length})
          </button>
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 12, cursor: "pointer",
                background: activeCategory === cat ? "rgba(74,127,212,0.2)" : "var(--color-background-secondary)",
                color: activeCategory === cat ? "var(--color-text-info)" : "var(--color-text-secondary)",
                border: `0.5px solid ${activeCategory === cat ? "rgba(74,127,212,0.4)" : "var(--color-border-secondary)"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {filtered.map(addon => {
          const installed = isInstalled(addon);
          return (
            <div
              key={addon.id}
              style={{
                background: "var(--color-background-secondary)",
                border: `0.5px solid ${installed ? "rgba(74,222,128,0.3)" : "var(--color-border-tertiary)"}`,
                borderRadius: "var(--border-radius-md)",
                padding: "14px 16px",
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>
                    {addon.name}
                  </div>
                  <span style={{
                    fontSize: 10, padding: "1px 7px", borderRadius: 8, fontWeight: 500,
                    background: "rgba(74,127,212,0.12)", color: "var(--color-text-info)",
                  }}>
                    {addon.category}
                  </span>
                </div>
                {installed && (
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 8, fontWeight: 600,
                    background: "rgba(74,222,128,0.12)", color: "var(--color-text-success)",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    ✓ {t("catalogInstalled")}
                  </span>
                )}
              </div>

              {/* Descrição */}
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.55, flex: 1 }}>
                {addon.description}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{addon.maintainer}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={addon.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "var(--color-text-info)", textDecoration: "none" }}
                  >
                    {t("docs")}
                  </a>
                  <a
                    href={addon.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "var(--color-text-info)", textDecoration: "none" }}
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "2rem 0", color: "var(--color-text-tertiary)", fontSize: 13 }}>
            {t("catalogEmpty")}
          </div>
        )}
      </div>
    </div>
  );
}
