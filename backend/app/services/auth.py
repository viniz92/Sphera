import os
import secrets

_tokens: set[str] = set()

USERNAME = os.getenv("PALANTIR_USERNAME", "admin")
PASSWORD = os.getenv("PALANTIR_PASSWORD", "admin")


def login(username: str, password: str) -> str | None:
    if username == USERNAME and password == PASSWORD:
        token = secrets.token_hex(32)
        _tokens.add(token)
        return token
    return None


def logout(token: str) -> None:
    _tokens.discard(token)


def is_valid(token: str) -> bool:
    return token in _tokens
