import { resolve } from 'node:path';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

const config: StorybookConfig = {
  stories: ['../src/renderer/src/components/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      resolve: {
        alias: {
          '@renderer': resolve(process.cwd(), 'src/renderer/src')
        }
      },
      esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react'
      },
      optimizeDeps: {
        esbuildOptions: {
          jsx: 'automatic',
          jsxImportSource: 'react'
        }
      },
      plugins: [svgr(), vanillaExtractPlugin()]
    });
  }
};

export default config;
