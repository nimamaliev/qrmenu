import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 3D models: Safari only opens AR Quick Look for a USDZ served as model/vnd.usdz+zip.
  headers: async () => [
    { source: "/models/:file*.usdz", headers: [{ key: "Content-Type", value: "model/vnd.usdz+zip" }] },
    { source: "/models/:file*.glb", headers: [{ key: "Content-Type", value: "model/gltf-binary" }] },
  ],
};

export default nextConfig;
