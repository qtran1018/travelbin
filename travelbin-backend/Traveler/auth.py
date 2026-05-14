import jwt
import requests as http_requests
from functools import lru_cache
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model

User = get_user_model()

KEYCLOAK_ISSUER = getattr(settings, "KEYCLOAK_ISSUER", "http://localhost:8180/realms/travel-platform")
KEYCLOAK_AUDIENCE = getattr(settings, "KEYCLOAK_AUDIENCE", None)


@lru_cache(maxsize=1)
def _get_jwks_client():
    jwks_uri = f"{KEYCLOAK_ISSUER}/protocol/openid-connect/certs"
    return jwt.PyJWKClient(jwks_uri, cache_keys=True)


def _validate_token(token: str) -> dict:
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        options = {"verify_aud": bool(KEYCLOAK_AUDIENCE)}
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=KEYCLOAK_ISSUER,
            audience=KEYCLOAK_AUDIENCE,
            options=options,
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token has expired")
    except jwt.InvalidTokenError as e:
        raise AuthenticationFailed(f"Invalid token: {e}")
    except Exception as e:
        raise AuthenticationFailed(f"Token validation failed: {e}")


def _provision_user(payload: dict) -> User:
    sub = payload.get("sub")
    email = (payload.get("email") or "").lower()
    username = payload.get("preferred_username") or email.split("@")[0]

    if not sub or not email:
        raise AuthenticationFailed("Token missing sub or email claim")

    user, _ = User.objects.get_or_create(
        keycloak_sub=sub,
        defaults={"email": email, "username": _unique_username(username)},
    )
    # Keep email in sync if it changed in Keycloak
    if user.email != email:
        user.email = email
        user.save(update_fields=["email"])
    return user


def _unique_username(base: str) -> str:
    base = base.lower().replace(" ", "_")[:95]
    username = base
    i = 1
    while User.objects.filter(username=username).exists():
        username = f"{base}_{i}"
        i += 1
    return username


class KeycloakJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]
        payload = _validate_token(token)
        user = _provision_user(payload)
        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer realm="travel-platform"'
