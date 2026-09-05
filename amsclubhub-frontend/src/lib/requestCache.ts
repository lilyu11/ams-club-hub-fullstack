/**
 * Cache + dedup GET requests phía client.
 *
 * Mục đích: giảm số request trùng lặp khi nhiều component cùng load một endpoint
 * trong cùng "phiên load trang" (VD: /users/me được SidebarLeft và BriefProfileWidget
 * cùng gọi). Lưu promise đang chạy → request trùng sẽ chờ cùng một promise (dedup),
 * và giữ kết quả trong TTL ngắn để reload component không gọi lại mạng.
 *
 * Map là module-level → reset mỗi lần reload trang. Không cache request POST/PUT/DELETE.
 */
import api from './api';

const DEFAULT_TTL = 30 * 1000; // 30 giây
const MAX_ENTRIES = 100; // chặn Map phình to không kiểm soát

interface CacheEntry {
  promise: Promise<any>;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

function makeKey(method: string, url: string, params?: any): string {
  let paramsKey = '';
  if (params && typeof params === 'object') {
    try {
      paramsKey = JSON.stringify(params);
    } catch {
      paramsKey = String(params);
    }
  }
  return `${method}:${url}:${paramsKey}`;
}

function prune() {
  if (cache.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [k, entry] of cache) {
    if (entry.expiry <= now) cache.delete(k);
  }
  // Vẫn quá lớn → clear toàn bộ (chỉ xảy ra khi rất nhiều request cùng lúc)
  if (cache.size > MAX_ENTRIES) cache.clear();
}

/**
 * GET qua cache: trả về dữ liệu (r.data) đã lưu hoặc đang được fetch dở.
 * Nếu request thất bại → xóa entry để lần gọi sau thử lại mạng (không giữ promise lỗi).
 */
export async function cachedGet<T = any>(
  url: string,
  params?: any,
  ttl: number = DEFAULT_TTL,
): Promise<T> {
  const key = makeKey('GET', url, params);
  const now = Date.now();
  const hit = cache.get(key);

  if (hit && hit.expiry > now) {
    return hit.promise as Promise<T>;
  }
  if (hit) cache.delete(key); // đã hết hạn

  const promise = api.get(url, { params }).then((res) => res.data);
  // Không giữ lỗi trong cache → lần gọi sau sẽ re-fetch
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });
  cache.set(key, { promise, expiry: now + ttl });
  prune();
  return promise;
}