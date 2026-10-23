import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Preserve the existing Render publish directory to avoid deployment-setting changes.
    build: {
      outDir: 'build',
      emptyOutDir: true
    },
    server: {
      port: 3000,
      strictPort: true
    },
    define: {
      // Keep compatibility with the existing Render variable while migrating from CRA.
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(
        env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || ''
      ),
      // The preview can use hash-based routes so deep links survive static hosting without a server rewrite.
      'process.env.REACT_APP_ROUTER_MODE': JSON.stringify(
        env.REACT_APP_ROUTER_MODE || process.env.REACT_APP_ROUTER_MODE || 'browser'
      )
    },
    test: {
      include: ['src/**/*.test.{js,jsx,ts,tsx}'],
      environment: 'jsdom',
      clearMocks: true,
      restoreMocks: true
    }
  };
});
