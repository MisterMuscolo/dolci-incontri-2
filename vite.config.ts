import { defineConfig } from "vite";
// import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger"; // Temporaneamente disabilitato
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    // dyadComponentTagger(), // Temporaneamente disabilitato per test
    react({
      jsxRuntime: 'automatic' // 'automatic' corrisponde a 'react-jsx'
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['react-leaflet', 'leaflet'], // Escludi queste librerie dalla pre-ottimizzazione
  },
}));