import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// Dev and build both default `cacheDir` to `node_modules/.vite`. That means
// running `astro build` while `astro dev` is live wipes the optimiser cache the
// dev server is still serving chunks from: the browser ends up holding deps
// from two optimiser generations, React resolves to two separate instances, and
// every Radix provider dies with "Cannot read properties of null (reading
// 'useRef')" or "useState". It looks exactly like a component bug and is not
// one. Separate directories make a running dev server survive a build.
const isBuild = process.argv.includes('build');

// https://astro.build/config
export default defineConfig({
  site: 'https://glitch-app.vercel.app',
  output: 'server',

  adapter: vercel(),

  // The Astro dev toolbar crashes with "Cannot read properties of undefined
  // (reading 'startTime')" in this setup and floods the console, which makes
  // real hydration errors impossible to spot. It is a dev-only overlay, so
  // switching it off costs nothing.
  devToolbar: { enabled: false },

  vite: {
    cacheDir: isBuild ? 'node_modules/.vite-build' : 'node_modules/.vite',
    plugins: [tailwindcss()],
    // A single React instance, always. Without this, a pre-bundled Radix package
    // can resolve its own copy of React and the app dies at runtime with
    // "Cannot read properties of null (reading 'useRef')" inside a Radix
    // provider — which looks like a component bug and is not one.
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
      // `dist/` and `.vercel/` are build output that lives inside this package.
      // Without this the dev server watches its own build artefacts, re-triggers
      // itself on every `astro build`, and thrashes (which also invalidates the
      // browser's module graph and produces bogus hydration errors).
      watch: {
        ignored: ['**/dist/**', '**/.vercel/**'],
      },
    },
    // Pre-bundle every Radix primitive and the other shared runtime deps up
    // front. Without this, Vite re-optimises its dependency cache every time an
    // import graph changes, and any browser tab still holding the previous
    // module URLs gets '504 Outdated Optimize Dep' — which shows up as React
    // islands silently failing to hydrate (dead buttons, permanent skeletons)
    // rather than as anything that looks like a caching problem.
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
