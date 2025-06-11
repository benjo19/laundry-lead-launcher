
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: false,
    hmr: {
      overlay: true
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [
      '@supabase/supabase-js', 
      '@supabase/postgrest-js',
      '@supabase/storage-js',
      '@supabase/realtime-js',
      '@supabase/gotrue-js'
    ]
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        warn(warning);
      }
    }
  },
  ssr: {
    noExternal: [
      '@supabase/postgrest-js',
      '@supabase/storage-js',
      '@supabase/realtime-js',
      '@supabase/gotrue-js'
    ]
  }
}));
