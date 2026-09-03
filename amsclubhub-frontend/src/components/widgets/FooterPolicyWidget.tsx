'use client';

import Link from 'next/link';

export default function FooterPolicyWidget() {
  return (
    <div className="px-3 text-xs text-muted-foreground space-y-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <Link href="/terms" prefetch={false} className="hover:underline">Điều khoản dịch vụ</Link>
        <Link href="/privacy" prefetch={false} className="hover:underline">Quyền riêng tư</Link>
        <Link href="/project-info" prefetch={false} className="hover:underline">Liên hệ admin</Link>
      </div>
      <p>© 2026 AmsClubHub. All rights reserved.</p>
    </div>
  );
} // UNDONE