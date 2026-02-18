declare module 'vite-plugin-svgr' {
  import type { PluginOption } from 'vite';

  type SvgrPluginOptions = {
    include?: string | string[];
    exclude?: string | string[];
    svgrOptions?: Record<string, unknown>;
    esbuildOptions?: Record<string, unknown>;
  };

  export default function svgr(options?: SvgrPluginOptions): PluginOption;
}
