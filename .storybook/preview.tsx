import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../src/renderer/src/assets/main.css';
import { ToastProvider } from '../src/renderer/src/components/ui/ToastProvider';

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: 0 },
      queries: { retry: 0, staleTime: 60 * 1000 }
    }
  });

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
          <ToastProvider>
            <Story />
          </ToastProvider>
        </QueryClientProvider>
      );
    }
  ]
};

export default preview;
