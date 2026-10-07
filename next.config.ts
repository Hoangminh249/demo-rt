import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Thay cho plugin next-intl (createNextIntlPlugin): plugin chỉ làm đúng alias này, nhưng kéo theo @swc/core
  // mà bản native trên máy này lỗi quyền thư mục cache. Đổi chỗ đặt file cấu hình i18n thì sửa ở đây.
  turbopack: { resolveAlias: { 'next-intl/config': './src/i18n/request.ts' } },
}

export default nextConfig
