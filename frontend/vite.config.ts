import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to backend
      "/auth": "http://localhost:4000",
      "/api": "http://localhost:4000",
      "/health": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
