import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// Separate Vite cache dirs so a running dev server survives an `astro build`.
const isBuild = process.argv.includes('build');

export default defineConfig({
  site: 'https://glitch-for-gamers.vercel.app',
  output: 'server',

  adapter: vercel(),

  // Dev toolbar crashes in this setup and floods the console with noise.
  devToolbar: { enabled: false },

  vite: {
    cacheDir: isBuild ? 'node_modules/.vite-build' : 'node_modules/.vite',
    plugins: [tailwindcss()],
    // Force a single React instance or Radix packages resolve their own copy.
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    // Dev proxy: forward /api to the backend so cookies are same-origin in development
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
      // Ignore build output or the dev server watches and re-triggers on it.
      watch: {
        ignored: ['**/dist/**', '**/.vercel/**'],
      },
    },
    // Pre-bundle shared deps; re-optimising causes '504 Outdated Optimize Dep'.
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-collapsible',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-form',
        '@radix-ui/react-select',
        '@radix-ui/react-slot',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-tooltip',
        'lucide-react',
        'nanostores',
        '@nanostores/react',
        'class-variance-authority',
      ],
    },
  },

  integrations: [react()],
});
