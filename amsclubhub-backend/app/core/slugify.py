"""Bộ chuyển chuỗi thành slug an toàn cho URL.

Thuần — KHÔNG import models (tránh circular import). Slug sinh từ tên CLB,
chuẩn hóa tiếng Việt: bỏ dấu (Unicode NFKD), chuyển đ/Đ -> d, lowercase,
thay ký tự không phải chữ-số bằng dấu gạch ngang.
VD: 'Hanoi Ams Rock Club' -> 'hanoi-ams-rock-club'
    'Hà Nội Đội Bóng'    -> 'ha-noi-doi-bong'
"""
import re
import unicodedata


def to_slug(text: str) -> str:
    if not text:
        return "club"

    # Chuyển đ/Đ thành d/D TRƯỚC khi tách dấu (đ không tách được thành d qua NFKD)
    text = text.replace("đ", "d").replace("Đ", "D")

    # Tách dấu: NFKD tách ký tự gốc + combining marks, rồi lọc bỏ combining marks
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))

    # Lowercase + thay toàn bộ chuỗi không phải chữ-số bằng dấu gạch ngang
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")

    # Giới hạn độ dài (cột slug VARCHAR(120))
    text = text[:100]

    return text or "club"