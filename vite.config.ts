import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')) as {
  name: string;
  version: string;
};

function collectFiles(path: string): string[] {
  const stat = statSync(path);
  if (stat.isFile()) {
    return [path];
  }

  return readdirSync(path)
    .flatMap((entry) => collectFiles(join(path, entry)))
    .sort();
}

function createAdminBuildId() {
  const hash = createHash('sha256');
  const inputs = [
    'index.html',
    'package-lock.json',
    'package.json',
    'vite.config.ts',
    'public',
    'src',
    'translations',
    'vendor'
  ];

  inputs
    .flatMap((input) => collectFiles(join(rootDir, input)))
    .sort()
    .forEach((filePath) => {
      hash.update(relative(rootDir, filePath));
      hash.update('\0');
      hash.update(readFileSync(filePath));
      hash.update('\0');
    });

  return hash.digest('hex').slice(0, 16);
}

function adminVersionPlugin(adminBuildId: string): Plugin {
  return {
    name: 'pixelrunner-admin-version',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ?? join(rootDir, 'dist');
      writeFileSync(
        join(outDir, 'version.json'),
        `${JSON.stringify(
          {
            app: packageJson.name,
            version: packageJson.version,
            adminBuildId
          },
          null,
          2
        )}\n`
      );
    }
  };
}

const adminBuildId = createAdminBuildId();

// https://vite.dev/config/
export default defineConfig({
  define: {
    __ADMIN_BUILD_ID__: JSON.stringify(adminBuildId)
  },
  plugins: [vue(), tailwindcss(), vueDevTools(), adminVersionPlugin(adminBuildId)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '(vendor)': fileURLToPath(new URL('./vendor', import.meta.url))
    }
  }
});
