import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'test/e2e/**', 'vendor/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions'] : ['default'],
      coverage: {
        exclude: ['vendor/**', 'translations/*.json']
      }
    }
  })
);
