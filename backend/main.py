from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import cluster, addons, access, auth as auth_router, events, node_metrics
from app.services.auth import is_valid

UNPROTECTED = {"/health", "/api/auth/login"}

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


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path in UNPROTECTED or request.method == "OPTIONS":
        return await call_next(request)
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.removeprefix("Bearer ").strip()
    if not token or not is_valid(token):
        return JSONResponse(status_code=401, content={"detail": "Não autenticado"})
    return await call_next(request)


app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(cluster.router, prefix="/api/cluster", tags=["cluster"])
app.include_router(addons.router, prefix="/api/addons", tags=["addons"])
app.include_router(access.router, prefix="/api/access", tags=["access"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(node_metrics.router, prefix="/api/metrics", tags=["metrics"])


@app.get("/health")
def health():
    return {"status": "ok"}
