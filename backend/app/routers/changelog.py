import time
from fastapi import APIRouter
import httpx
from app.services.compatibility import ADDON_META

router = APIRouter()

_cache: dict[str, tuple[float, list]] = {}
_TTL = 3600  # 1 hora


def _fetch(github_url: str) -> list:
    now = time.time()
    if github_url in _cache and now - _cache[github_url][0] < _TTL:
        return _cache[github_url][1]
    try:
        parts = github_url.replace("https://github.com/", "").rstrip("/").split("/")
        if len(parts) < 2:
            return []
        owner, repo = parts[0], parts[1]
        r = httpx.get(
            f"https://api.github.com/repos/{owner}/{repo}/releases?per_page=5",
            timeout=6,
            headers={"Accept": "application/vnd.github+json"},
        )
        if r.status_code == 200:
            releases = [
                {
                    "tag": rel["tag_name"],
                    "name": rel["name"] or rel["tag_name"],
                    "date": rel["published_at"][:10],
                    "url": rel["html_url"],
                }
                for rel in r.json()[:5]
                if not rel.get("draft")
            ]
            _cache[github_url] = (now, releases)
            return releases
    except Exception:
        pass
    _cache[github_url] = (now, [])
    return []


@router.get("/{addon_name}")
def get_changelog(addon_name: str):
    meta = ADDON_META.get(addon_name, {})
    github_url = meta.get("github_url", "")
    if not github_url:
        return {"releases": [], "github_url": ""}
    releases = _fetch(github_url)
    return {"releases": releases, "github_url": github_url}
