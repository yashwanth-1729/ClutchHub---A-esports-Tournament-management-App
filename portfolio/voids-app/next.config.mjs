/** VOIDS is served from voidbyte.tech/voids as a static export: no server, works offline once loaded. */
const nextConfig = {
  output: 'export',
  basePath: '/voids',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
}
export default nextConfig
