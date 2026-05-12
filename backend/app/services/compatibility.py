from typing import Literal
from packaging.version import Version

# Matriz de compatibilidade: addon → versão EKS → versão mínima do addon
# "ok" = qualquer versão atual é compatível
# "min:X.Y.Z" = precisa de pelo menos X.Y.Z
COMPATIBILITY: dict[str, dict[str, str]] = {
    "vpc-cni": {
        "1.27": "ok",
        "1.28": "ok",
        "1.29": "min:1.16.0",
        "1.30": "min:1.18.0",
        "1.31": "min:1.19.0",
    },
    "coredns": {
        "1.27": "ok",
        "1.28": "ok",
        "1.29": "ok",
        "1.30": "ok",
        "1.31": "ok",
    },
    "kube-proxy": {
        "1.27": "ok",
        "1.28": "ok",
        "1.29": "min:1.29.0",
        "1.30": "min:1.30.0",
        "1.31": "min:1.31.0",
    },
    "aws-load-balancer-controller": {
        "1.27": "ok",
        "1.28": "ok",
        "1.29": "ok",
        "1.30": "ok",
        "1.31": "ok",
    },
    "cluster-autoscaler": {
        "1.27": "ok",
        "1.28": "ok",
        "1.29": "min:1.29.0",
        "1.30": "min:1.30.0",
        "1.31": "min:1.31.0",
    },
    "ebs-csi-driver": {
        "1.27": "ok",
        "1.28": "ok",
        "1.29": "min:1.25.0",
        "1.30": "min:1.26.0",
        "1.31": "min:1.27.0",
    },
    "aws-ebs-csi-driver": {
        "1.27": "ok",
        "1.28": "ok",
        "1.29": "min:1.25.0",
        "1.30": "min:1.26.0",
        "1.31": "min:1.27.0",
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
