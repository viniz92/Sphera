import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import cluster, addons, access
from app.services.k8s import init_in_cluster


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("RUNNING_IN_CLUSTER") == "true":
        init_in_cluster()
    yield


app = FastAPI(
    title="Palantir API",
    description="Backend para o Palantir — EKS versões, addons e compatibilidade",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cluster.router, prefix="/api/cluster", tags=["cluster"])
app.include_router(addons.router, prefix="/api/addons", tags=["addons"])
app.include_router(access.router, prefix="/api/access", tags=["access"])


@app.get("/health")
def health():
    return {"status": "ok"}
