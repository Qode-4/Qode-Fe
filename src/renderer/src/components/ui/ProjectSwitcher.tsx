import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../../lib/hashRouter';

type ProjectItem = {
  id: string;
  name: string;
};

type Props = {
  projects: ProjectItem[];
  selectedProjectId?: string;
  onOpenCreateProject?: () => void;
  isError?: boolean;
  isFetching?: boolean;
  onRetry?: () => void;
  className?: string;
};

const FALLBACK_LABEL = '새 프로젝트';

// 첫 글자를 아이콘 문자로 뽑는다. 이모지/서로게이트 페어에서 깨지지 않도록 코드 포인트 단위로 자른다.
// 영문은 대문자, 한글·숫자 등은 그대로 둔다(toUpperCase는 한글에서 no-op).
const getInitialCharacter = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const first = Array.from(trimmed)[0] ?? '?';
  return first.toUpperCase();
};

export const ProjectSwitcher = ({
  projects,
  selectedProjectId,
  onOpenCreateProject,
  isError = false,
  isFetching = false,
  onRetry,
  className
}: Props): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedProjectLabel = useMemo(() => {
    const selectedProject = projects.find((project) => project.id === selectedProjectId);
    return selectedProject?.name?.trim() || FALLBACK_LABEL;
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent): void => {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className={['relative min-w-0', className ?? ''].join(' ')}>
      <button
        type="button"
        className={[
          'flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-line bg-surface px-2 text-left transition-colors',
          'hover:bg-surface-muted active:bg-surface-muted'
        ].join(' ')}
        aria-label="프로젝트 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span
          aria-hidden="true"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface text-caption font-semibold text-fg-subtle"
        >
          {getInitialCharacter(selectedProjectLabel)}
        </span>
        <span className="min-w-0 flex-1 truncate text-label font-normal text-fg-default">
          {selectedProjectLabel}
        </span>
        <span
          aria-hidden="true"
          className={[
            'shrink-0 text-caption leading-none text-fg-muted transition-transform',
            open ? 'rotate-180 text-fg-subtle' : ''
          ].join(' ')}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full min-w-[220px] overflow-hidden rounded-md border border-line bg-surface py-1 shadow-none max-sm:min-w-0">
          <div
            role="listbox"
            aria-label="내 프로젝트 목록"
            className="max-h-[420px] overflow-y-auto px-1"
          >
            {isError ? (
              <div className="px-2 py-2" role="alert">
                <p className="mb-2 px-2 text-body text-fg-subtle">
                  프로젝트 목록을 불러올 수 없습니다.
                </p>
                <button
                  type="button"
                  className="w-full rounded-[10px] border border-line px-3 py-2 text-body font-medium text-fg-default transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isFetching || !onRetry}
                  onClick={() => onRetry?.()}
                >
                  {isFetching ? '재시도 중...' : '다시 시도'}
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="px-4 py-3 text-label text-fg-muted">프로젝트가 없습니다.</div>
            ) : (
              projects.map((project) => {
                const isSelected = project.id === selectedProjectId;
                const projectInitial = getInitialCharacter(project.name);

                return (
                  <div
                    key={project.id}
                    className={[
                      'group flex items-center gap-1 rounded-[6px] transition-colors',
                      isSelected ? 'bg-surface-muted' : 'hover:bg-surface-muted'
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-[6px] bg-transparent px-2 py-1.5 text-left text-body font-medium text-fg-default transition-colors"
                      onClick={() => {
                        setOpen(false);
                        navigate(`/projects/${project.id}`);
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface text-caption font-semibold text-fg-subtle"
                      >
                        {projectInitial}
                      </span>
                      <span className="truncate">{project.name}</span>
                    </button>
                  </div>
                );
              })
            )}

            <button
              type="button"
              className="mt-1 flex w-full items-center gap-2 rounded-[12px] px-4 py-2.5 text-left text-body font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg-subtle"
              onClick={() => {
                setOpen(false);
                onOpenCreateProject?.();
              }}
            >
              <span className="text-title leading-none">+</span>
              <span>새 프로젝트</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
