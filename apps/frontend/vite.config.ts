import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { 
    host: true, // Listen on all local IP addresses (0.0.0.0) so mobile devices on Wi-Fi can connect
    port: 5173,
    proxy: {
      "/uploads": "http://localhost:4000",
      "/api": "http://localhost:4000"
    }
  },
});
