import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [
      "carbon-variable-passing.ngrok-free.dev",
    ],
    proxy: {
      // Proxies API calls to backend
      "/api": "http://localhost:4000",
      
      // Proxies images from your backend data folder
      "/screenshots": "http://localhost:4000",
      "/diffs": "http://localhost:4000",
      "/baselines": "http://localhost:4000",
    },
  },
});