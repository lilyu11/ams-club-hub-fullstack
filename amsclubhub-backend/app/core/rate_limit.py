import time as _time
import uuid as _uuid
from fastapi import Request, HTTPException, status
from app.core.redis import get_redis
from typing import Optional

class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client

    async def check_rate_limit(
        self,
        key: str,
        limit: int,
        window_seconds: int,
        block_seconds: int = 0
    ) -> tuple[bool, dict]:
        """
        Kiểm tra rate limit bằng thuật toán cửa sổ trượt (sliding window algorithm)
        Return (allowed, info_dict), info_dict chứa remaining, reset_time,...
        """
        # Nếu Redis bị sập hoặc chưa khởi tạo, hàm lập tức cho phép request đi qua (Fail-Open)
        # để tránh làm đứt gãy trải nghiệm người dùng
        if not self.redis:
            return True, {"remaining": limit, "reset": 0}

        now = int(_time.time())
        window_start = now - window_seconds

        pipe = self.redis.pipeline()
        # Xóa toàn bộ các request cũ nằm ngoài khung thời gian trượt (< window_start)
        pipe.zremrangebyscore(key, 0, window_start)

        # Đếm số lượng request hiện có trong khung thời gian hợp lệ
        pipe.zcard(key)

        # Ghi nhận request hiện tại vào Redis
        # Dùng chuỗi unique dạng uuid ngắn để không trùng lặp
        pipe.zadd(key, {f"{now}:{_uuid.uuid4().hex[:8]}": now})

        # Cài đặt thời gian tự hủy cho key
        pipe.expire(key, window_seconds + 1)

        results = await pipe.execute()

        current_count = results[1] # Tương ứng với pipe.zcard(key)
        remaining = max(0, limit - current_count - 1)
        reset_time = now + window_seconds

        allowed = current_count < limit

        info = {
            "allowed": allowed,
            "remaining": remaining,
            "reset": reset_time,
            "limit": limit,
            "window": window_seconds
        }

        if not allowed and block_seconds > 0:
            # Add to block list
            block_key = f"block:{key}"
            await self.redis.setex(block_key, block_seconds, "1")

        return allowed, info

    async def is_blocked(self, key: str) -> bool:
        if not self.redis:
            return False
        block_key = f"block:{key}"
        return await self.redis.exists(block_key) > 0


async def get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"


def create_rate_limit_key(prefix: str, ip: str, email: str = None) -> str:
    """Create rate limit key combining IP and optional email."""
    if email:
        return f"ratelimit:{prefix}:{ip}:{email}"
    return f"ratelimit:{prefix}:{ip}"


# Rate limit configs
OTP_SEND_LIMIT = 3        # max 3 requests
OTP_SEND_WINDOW = 900     # 15 minutes = 900 seconds
OTP_SEND_COOLDOWN = 60    # 1 minute cooldown between requests
OTP_BLOCK_DURATION = 900  # 15 minutes block after exceeding


rate_limiter_instance = None

def get_rate_limiter():
    global rate_limiter_instance
    if rate_limiter_instance is None:
        rate_limiter_instance = RateLimiter(get_redis())
    return rate_limiter_instance