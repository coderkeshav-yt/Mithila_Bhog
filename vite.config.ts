import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      port: 8080,
      host: 'localhost',
      protocol: 'ws'
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
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: `[name].${mode === 'production' ? 'js' : 'ts'}`,
        chunkFileNames: `[name].${mode === 'production' ? 'js' : 'ts'}`,
        assetFileNames: `assets/[name].[ext]`
      }
    },
    minify: mode === 'production',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  publicDir: 'public',
  optimizeDeps: {
    include: [
      '@tanstack/react-query',
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      'react-router-dom',
      '@headlessui/react',
      'class-variance-authority',
      'tailwind-merge',
      'clsx'
    ]
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp']
}));
