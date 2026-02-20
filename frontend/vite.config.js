import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const basePath = process.env.VITE_BASE_PATH || "/";
const appPort = Number(process.env.PORT) || 4173;

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: appPort,
    allowedHosts: true,
  },
});
