from datetime import datetime, timedelta, timezone

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
