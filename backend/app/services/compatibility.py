from typing import Literal
from packaging.version import Version

# Matriz de compatibilidade: addon → versão EKS → versão mínima do addon
# "ok" = qualquer versão atual é compatível
# "min:X.Y.Z" = precisa de pelo menos X.Y.Z
COMPATIBILITY: dict[str, dict[str, str]] = {
    "vpc-cni": {
        "1.27": "ok", "1.28": "ok", "1.29": "min:1.16.0", "1.30": "min:1.18.0",
        "1.31": "min:1.19.0", "1.32": "min:1.19.2", "1.33": "min:1.20.0", "1.34": "min:1.21.0",
    },
    "coredns": {
        "1.27": "ok", "1.28": "ok", "1.29": "ok", "1.30": "ok",
        "1.31": "ok", "1.32": "ok", "1.33": "ok", "1.34": "ok",
    },
    "kube-proxy": {
        "1.27": "ok", "1.28": "ok", "1.29": "min:1.29.0", "1.30": "min:1.30.0",
        "1.31": "min:1.31.0", "1.32": "min:1.32.0", "1.33": "min:1.33.0", "1.34": "min:1.34.0",
    },
    "aws-load-balancer-controller": {
        "1.27": "ok", "1.28": "ok", "1.29": "ok", "1.30": "ok",
        "1.31": "ok", "1.32": "min:2.8.0", "1.33": "min:2.9.0", "1.34": "min:2.10.0",
    },
    "cluster-autoscaler": {
        "1.27": "ok", "1.28": "ok", "1.29": "min:1.29.0", "1.30": "min:1.30.0",
        "1.31": "min:1.31.0", "1.32": "min:1.32.0", "1.33": "min:1.33.0", "1.34": "min:1.34.0",
    },
    "ebs-csi-driver": {
        "1.27": "ok", "1.28": "ok", "1.29": "min:1.25.0", "1.30": "min:1.26.0",
        "1.31": "min:1.27.0", "1.32": "min:1.28.0", "1.33": "min:1.29.0", "1.34": "min:1.30.0",
    },
    "aws-ebs-csi-driver": {
        "1.27": "ok", "1.28": "ok", "1.29": "min:1.25.0", "1.30": "min:1.26.0",
        "1.31": "min:1.27.0", "1.32": "min:1.28.0", "1.33": "min:1.29.0", "1.34": "min:1.30.0",
    },
}

# Metadados estáticos por addon
ADDON_META: dict[str, dict] = {
    "vpc-cni": {
        "has_ui": False, "maintainer": "AWS", "category": "Rede", "update_freq": "Mensal",
        "description": "Gerencia interfaces de rede para pods dentro da VPC usando IPs nativos da AWS.",
        "doc_url": "https://docs.aws.amazon.com/eks/latest/userguide/managing-vpc-cni.html",
        "changelog_url": "https://github.com/aws/amazon-vpc-cni-k8s/releases",
        "github_url": "https://github.com/aws/amazon-vpc-cni-k8s",
    },
    "coredns": {
        "has_ui": False, "maintainer": "CNCF / AWS", "category": "DNS", "update_freq": "Trimestral",
        "description": "Serviço de DNS interno do cluster. Resolve nomes de serviços Kubernetes para IPs internos.",
        "doc_url": "https://docs.aws.amazon.com/eks/latest/userguide/managing-coredns.html",
        "changelog_url": "https://github.com/coredns/coredns/releases",
        "github_url": "https://github.com/coredns/coredns",
    },
    "kube-proxy": {
        "has_ui": False, "maintainer": "AWS", "category": "Rede", "update_freq": "Por versão do EKS",
        "description": "Mantém regras de rede nos nós. Responsável pelo roteamento de tráfego entre serviços e pods.",
        "doc_url": "https://docs.aws.amazon.com/eks/latest/userguide/managing-kube-proxy.html",
        "changelog_url": "https://github.com/kubernetes/kubernetes/releases",
        "github_url": "https://github.com/kubernetes/kubernetes",
    },
    "aws-load-balancer-controller": {
        "has_ui": False, "maintainer": "AWS", "category": "Ingress / Load Balancer", "update_freq": "Bimestral",
        "description": "Provisiona ALBs e NLBs da AWS automaticamente a partir de recursos Ingress e Service.",
        "doc_url": "https://kubernetes-sigs.github.io/aws-load-balancer-controller/",
        "changelog_url": "https://github.com/kubernetes-sigs/aws-load-balancer-controller/releases",
        "github_url": "https://github.com/kubernetes-sigs/aws-load-balancer-controller",
    },
    "cluster-autoscaler": {
        "has_ui": False, "maintainer": "Kubernetes SIG", "category": "Escalabilidade", "update_freq": "Por versão do EKS",
        "description": "Escala automaticamente os node groups com base na demanda de pods pendentes.",
        "doc_url": "https://docs.aws.amazon.com/eks/latest/userguide/autoscaling.html",
        "changelog_url": "https://github.com/kubernetes/autoscaler/releases",
        "github_url": "https://github.com/kubernetes/autoscaler",
    },
    "ebs-csi-driver": {
        "has_ui": False, "maintainer": "AWS", "category": "Storage", "update_freq": "Mensal",
        "description": "Driver CSI para volumes EBS. Permite que pods montem e gerenciem volumes EBS como PersistentVolumes.",
        "doc_url": "https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html",
        "changelog_url": "https://github.com/kubernetes-sigs/aws-ebs-csi-driver/releases",
        "github_url": "https://github.com/kubernetes-sigs/aws-ebs-csi-driver",
    },
    "argocd": {
        "has_ui": True, "maintainer": "CNCF", "category": "GitOps / CD", "update_freq": "Mensal",
        "description": "Ferramenta de GitOps para deploy contínuo. Sincroniza o estado do cluster com repositórios Git.",
        "doc_url": "https://argo-cd.readthedocs.io/",
        "changelog_url": "https://github.com/argoproj/argo-cd/releases",
        "github_url": "https://github.com/argoproj/argo-cd",
    },
    "grafana": {
        "has_ui": True, "maintainer": "Grafana Labs", "category": "Observabilidade", "update_freq": "Mensal",
        "description": "Plataforma de visualização de métricas e dashboards. Integra com Prometheus, CloudWatch e outras fontes.",
        "doc_url": "https://grafana.com/docs/",
        "changelog_url": "https://github.com/grafana/grafana/releases",
        "github_url": "https://github.com/grafana/grafana",
    },
    "kiali": {
        "has_ui": True, "maintainer": "CNCF / Istio", "category": "Service Mesh", "update_freq": "Bimestral",
        "description": "Console de observabilidade para Istio. Visualiza tráfego, dependências e health do service mesh.",
        "doc_url": "https://kiali.io/docs/",
        "changelog_url": "https://github.com/kiali/kiali/releases",
        "github_url": "https://github.com/kiali/kiali",
    },
    "argo-workflows": {
        "has_ui": True, "maintainer": "CNCF / Argo Project", "category": "GitOps / CD", "update_freq": "Mensal",
        "description": "Motor de workflows para Kubernetes. Executa DAGs e pipelines de CI/CD como pods nativos.",
        "doc_url": "https://argoproj.github.io/argo-workflows/",
        "changelog_url": "https://github.com/argoproj/argo-workflows/releases",
        "github_url": "https://github.com/argoproj/argo-workflows",
    },
    "palantir": {
        "has_ui": True, "maintainer": "Seru", "category": "Observabilidade / EKS", "update_freq": "Contínuo",
        "description": "Dashboard de monitoramento do cluster EKS — versões, addons, compatibilidade e node groups.",
        "doc_url": "https://github.com/viniz92/palantir",
        "changelog_url": "https://github.com/viniz92/palantir/releases",
        "github_url": "https://github.com/viniz92/palantir",
    },
    "metrics-server": {
        "has_ui": False, "maintainer": "Kubernetes SIG", "category": "Observabilidade", "update_freq": "Por versão do EKS",
        "description": "Coleta métricas de CPU e memória dos nós e pods via Kubelet. Necessário para HPA e kubectl top.",
        "doc_url": "https://github.com/kubernetes-sigs/metrics-server",
        "changelog_url": "https://github.com/kubernetes-sigs/metrics-server/releases",
        "github_url": "https://github.com/kubernetes-sigs/metrics-server",
    },
    "cert-manager": {
        "has_ui": False, "maintainer": "CNCF / Jetstack", "category": "Segurança / TLS", "update_freq": "Bimestral",
        "description": "Gerencia certificados TLS automaticamente via Let's Encrypt, Vault e outros issuers.",
        "doc_url": "https://cert-manager.io/docs/",
        "changelog_url": "https://github.com/cert-manager/cert-manager/releases",
        "github_url": "https://github.com/cert-manager/cert-manager",
    },
    "external-dns": {
        "has_ui": False, "maintainer": "Kubernetes SIG", "category": "DNS", "update_freq": "Bimestral",
        "description": "Sincroniza registros DNS externos (Route53, Cloudflare etc.) com Services e Ingresses do cluster.",
        "doc_url": "https://kubernetes-sigs.github.io/external-dns/",
        "changelog_url": "https://github.com/kubernetes-sigs/external-dns/releases",
        "github_url": "https://github.com/kubernetes-sigs/external-dns",
    },
    "ingress-nginx": {
        "has_ui": False, "maintainer": "Kubernetes", "category": "Ingress / Load Balancer", "update_freq": "Mensal",
        "description": "Controller de Ingress baseado em Nginx. Roteamento HTTP/HTTPS para serviços do cluster.",
        "doc_url": "https://kubernetes.github.io/ingress-nginx/",
        "changelog_url": "https://github.com/kubernetes/ingress-nginx/releases",
        "github_url": "https://github.com/kubernetes/ingress-nginx",
    },
    "karpenter": {
        "has_ui": False, "maintainer": "AWS", "category": "Escalabilidade", "update_freq": "Mensal",
        "description": "Auto-scaler de nós de alta performance. Provisiona instâncias EC2 em segundos baseado em pods pendentes.",
        "doc_url": "https://karpenter.sh/docs/",
        "changelog_url": "https://github.com/aws/karpenter/releases",
        "github_url": "https://github.com/aws/karpenter",
    },
    "keda": {
        "has_ui": False, "maintainer": "CNCF", "category": "Escalabilidade", "update_freq": "Bimestral",
        "description": "Kubernetes Event-driven Autoscaling. Escala workloads baseado em métricas externas (SQS, Kafka, etc.).",
        "doc_url": "https://keda.sh/docs/",
        "changelog_url": "https://github.com/kedacore/keda/releases",
        "github_url": "https://github.com/kedacore/keda",
    },
    "velero": {
        "has_ui": False, "maintainer": "VMware / CNCF", "category": "Backup / DR", "update_freq": "Trimestral",
        "description": "Backup e restore de recursos Kubernetes e volumes persistentes. Suporta S3 e outros providers.",
        "doc_url": "https://velero.io/docs/",
        "changelog_url": "https://github.com/vmware-tanzu/velero/releases",
        "github_url": "https://github.com/vmware-tanzu/velero",
    },
    "sealed-secrets": {
        "has_ui": False, "maintainer": "Bitnami", "category": "Segurança", "update_freq": "Bimestral",
        "description": "Encripta Secrets do Kubernetes para armazenamento seguro em Git (GitOps-friendly).",
        "doc_url": "https://github.com/bitnami-labs/sealed-secrets",
        "changelog_url": "https://github.com/bitnami-labs/sealed-secrets/releases",
        "github_url": "https://github.com/bitnami-labs/sealed-secrets",
    },
    "reloader": {
        "has_ui": False, "maintainer": "Stakater", "category": "Operações", "update_freq": "Mensal",
        "description": "Reinicia automaticamente pods quando ConfigMaps ou Secrets são alterados.",
        "doc_url": "https://github.com/stakater/Reloader",
        "changelog_url": "https://github.com/stakater/Reloader/releases",
        "github_url": "https://github.com/stakater/Reloader",
    },
    "prometheus": {
        "has_ui": False, "maintainer": "CNCF", "category": "Observabilidade", "update_freq": "Mensal",
        "description": "Sistema de monitoramento e alertas. Coleta e armazena métricas em time-series.",
        "doc_url": "https://prometheus.io/docs/",
        "changelog_url": "https://github.com/prometheus/prometheus/releases",
        "github_url": "https://github.com/prometheus/prometheus",
    },
    "descheduler": {
        "has_ui": False, "maintainer": "Kubernetes SIG", "category": "Escalabilidade", "update_freq": "Trimestral",
        "description": "Remove e reagenda pods mal distribuídos para otimizar a utilização dos nós.",
        "doc_url": "https://github.com/kubernetes-sigs/descheduler",
        "changelog_url": "https://github.com/kubernetes-sigs/descheduler/releases",
        "github_url": "https://github.com/kubernetes-sigs/descheduler",
    },
}


def check_compat(addon_name: str, addon_version: str, eks_version: str) -> tuple[Literal["ok", "upd", "incompat"], str | None, Literal["warn", "danger"] | None]:
    """
    Retorna (status, required_version, action_type)
    """
    key = addon_name.lower().replace("aws-", "").strip()
    matrix = COMPATIBILITY.get(addon_name, COMPATIBILITY.get(key, {}))
    rule = matrix.get(eks_version, "ok")

    if rule == "ok":
        return "ok", None, None

    min_ver_str = rule.replace("min:", "")
    try:
        current = Version(addon_version.lstrip("v"))
        required = Version(min_ver_str)
        if current >= required:
            return "ok", None, None
        # verifica quão distante está — diferença de minor = danger, patch = warn
        if required.major > current.major or required.minor > current.minor + 1:
            return "incompat", f"v{min_ver_str}+", "danger"
        return "upd", f"v{min_ver_str}+", "warn"
    except Exception:
        return "upd", f"v{min_ver_str}+", "warn"
