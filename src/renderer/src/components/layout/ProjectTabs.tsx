import { buildPath } from '../../lib/hashRouter';

type Props = {
  projectId: string;
  current: 'detail' | 'storage';
};

const TAB_BASE = 'relative inline-flex h-9 items-center px-3 text-sm font-medium transition-colors';
const TAB_ACTIVE = 'text-text-base';
const TAB_INACTIVE = 'text-text-subtle hover:text-text-base';

export const ProjectTabs = ({ projectId, current }: Props): React.JSX.Element => {
  const detailPath = `#${buildPath(`/projects/${projectId}`)}`;
  const storagePath = `#${buildPath(`/projects/${projectId}/storage`)}`;

  return (
    <div className="flex items-center gap-1 border-b border-line">
      <a
        href={detailPath}
        className={[TAB_BASE, current === 'detail' ? TAB_ACTIVE : TAB_INACTIVE].join(' ')}
        aria-current={current === 'detail' ? 'page' : undefined}
      >
        질문공간
        {current === 'detail' ? (
          <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary" />
        ) : null}
      </a>
      <a
        href={storagePath}
        className={[TAB_BASE, current === 'storage' ? TAB_ACTIVE : TAB_INACTIVE].join(' ')}
        aria-current={current === 'storage' ? 'page' : undefined}
      >
        저장소
        {current === 'storage' ? (
          <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary" />
        ) : null}
      </a>
    </div>
  );
};
