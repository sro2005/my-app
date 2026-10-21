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
      )
    },
    // The existing codebase contains JSX in .js files; opt those files into Oxc's JSX parser.
    oxc: {
      include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
      jsx: { runtime: 'automatic' }
    },
    test: {
      include: ['src/**/*.test.{js,jsx,ts,tsx}'],
      environment: 'jsdom',
      clearMocks: true,
      restoreMocks: true
    }
  };
});
