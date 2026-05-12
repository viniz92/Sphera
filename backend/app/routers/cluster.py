from fastapi import APIRouter, UploadFile, File
from app.services.k8s import load_kubeconfig_from_bytes
from app.services.eks import get_cluster_info
from app.models.cluster import ClusterInfo

router = APIRouter()


@router.post("/upload")
async def upload_kubeconfig(file: UploadFile = File(...)):
    """
    Recebe o kubeconfig via upload, carrega em memória e retorna as infos do cluster.
    O arquivo nunca é persistido em disco.
    """
    content = await file.read()
    load_kubeconfig_from_bytes(content)
    info = get_cluster_info()
    return info


@router.get("/info", response_model=ClusterInfo)
def cluster_info():
    """Retorna informações do cluster atualmente carregado."""
    return get_cluster_info()
