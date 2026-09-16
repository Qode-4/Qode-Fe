import { useState } from 'react';
import { useGetHealth } from '../../api/auth/useHealthAPI';

function Versions(): React.JSX.Element {
  const [versions] = useState(() => window.electron?.process?.versions ?? null);
  const { data, isLoading, isError } = useGetHealth();
  const healthLabel = isLoading ? 'loading' : isError ? 'error' : data?.ok ? 'ok' : 'unknown';

  return (
    <ul className="space-y-1 text-xs text-text-subtle">
      <li>Electron v{versions?.electron ?? 'web'}</li>
      <li>Chromium v{versions?.chrome ?? 'web'}</li>
      <li>Node v{versions?.node ?? 'web'}</li>
      <li>API health: {healthLabel}</li>
    </ul>
  );
}

export default Versions;
