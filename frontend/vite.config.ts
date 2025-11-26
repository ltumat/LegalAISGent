import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

export default defineConfig({
	server: {
		proxy: {
			"/api": {
				target: backendUrl,
				changeOrigin: true,
			},
		},
	},
	plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
});
