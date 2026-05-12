from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import cluster, addons, access

app = FastAPI(
    title="EKS Dashboard API",
    description="Backend para o EKS Dashboard — versões, addons e compatibilidade",
    version="1.0.0",
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
