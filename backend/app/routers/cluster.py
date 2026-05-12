import os
from fastapi import APIRouter, UploadFile, File
from app.services.k8s import load_kubeconfig_from_bytes, is_in_cluster
from app.services.eks import get_cluster_info
from app.models.cluster import ClusterInfo

router = APIRouter()


@router.get("/mode")
def get_mode():
    in_cluster = is_in_cluster() or os.getenv("RUNNING_IN_CLUSTER") == "true"
    return {"mode": "in-cluster" if in_cluster else "local"}


@router.post("/upload")
async def upload_kubeconfig(file: UploadFile = File(...)):
    content = await file.read()
    load_kubeconfig_from_bytes(content)
    info = get_cluster_info()
    return info


@router.get("/info", response_model=ClusterInfo)
def cluster_info():
    return get_cluster_info()
