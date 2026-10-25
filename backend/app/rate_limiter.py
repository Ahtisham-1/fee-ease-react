from datetime import datetime, timedelta, timezone

from fastapi import Request

REQUEST_LIMIT = 5

WINDOW_SECONDS = 600

request_history: dict[str, list[datetime]] = {}


def is_rate_limited(ip_address: str) -> bool:
    now = datetime.now(timezone.utc)

    window_start = now - timedelta(seconds=WINDOW_SECONDS)
    recent_requests = [
        request_time
        for request_time in request_history.get(ip_address, [])
        if request_time > window_start
    ]
    if len(recent_requests) >= REQUEST_LIMIT:
        request_history[ip_address] = recent_requests
        return True
    recent_requests.append(now)
    request_history[ip_address] = recent_requests
    return False


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"
