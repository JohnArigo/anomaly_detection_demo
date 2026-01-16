import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/anomaly_detection_demo/",
  plugins: [react()],
});
