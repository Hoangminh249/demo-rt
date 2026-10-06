import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Ảnh demo là SVG placeholder trong /public/images — không cần tối ưu.
  images: { unoptimized: true },
}

export default nextConfig
