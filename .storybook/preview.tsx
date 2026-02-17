import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_KEY } from '../src/renderer/src/api/queryKeys';
import '../src/renderer/src/assets/main.css';

const createQueryClient = (): QueryClient => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: 0 },
      queries: { retry: 0, staleTime: 60 * 1000 }
    }
  });

  queryClient.setQueryData(QUERY_KEY.health, { ok: true });
  return queryClient;
};

window.electron =
  window.electron ||
  ({
    process: {
      versions: {
        electron: 'storybook',
        chrome: 'storybook',
        node: 'storybook'
      }
    }
  } as typeof window.electron);

const preview: Preview = {
  parameters: {
    actions: {
      argTypesRegex: '^on[A-Z].*'
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();

      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    }
  ]
};

export default preview;
