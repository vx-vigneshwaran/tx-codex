import { defineConfig } from "vite";

export default defineConfig({
  server: { host: true, port: Number(process.env.PORT ?? 3002) }
});
