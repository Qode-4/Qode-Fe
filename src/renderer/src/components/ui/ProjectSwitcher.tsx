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

  const selectedInitial = useMemo(
    () => getInitialCharacter(selectedProjectLabel),
    [selectedProjectLabel]
  );

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
          'flex min-w-0 items-center gap-2 rounded-[10px] px-2 py-1.5 text-left transition-colors',
          'hover:bg-zinc-100 active:bg-zinc-100'
        ].join(' ')}
        aria-label="프로젝트 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span
          aria-hidden="true"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-zinc-200 bg-zinc-100 text-[11px] font-semibold text-zinc-600"
        >
          {selectedInitial}
        </span>
        <span className="min-w-0 truncate text-ui-12 font-semibold text-zinc-900">
          {selectedProjectLabel}
        </span>
        <span
          aria-hidden="true"
          className={[
            'shrink-0 text-[11px] leading-none text-zinc-500 transition-transform',
            open ? 'rotate-180 text-zinc-700' : ''
          ].join(' ')}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[220px] overflow-hidden rounded-[18px] border border-zinc-200 bg-white py-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
          <div
            role="listbox"
            aria-label="내 프로젝트 목록"
            className="max-h-[420px] overflow-y-auto px-2"
          >
            {isError ? (
              <div className="px-2 py-2" role="alert">
                <p className="mb-2 px-2 text-[13px] text-zinc-600">
                  프로젝트 목록을 불러올 수 없습니다.
                </p>
                <button
                  type="button"
                  className="w-full rounded-[10px] border border-zinc-200 px-3 py-2 text-[13px] font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isFetching || !onRetry}
                  onClick={() => onRetry?.()}
                >
                  {isFetching ? '재시도 중...' : '다시 시도'}
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-500">프로젝트가 없습니다.</div>
            ) : (
              projects.map((project) => {
                const isSelected = project.id === selectedProjectId;
                const projectInitial = getInitialCharacter(project.name);

                return (
                  <div
                    key={project.id}
                    className={[
                      'group flex items-center gap-1 rounded-[12px] transition-colors',
                      isSelected ? 'bg-zinc-100' : 'hover:bg-zinc-100'
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      className={[
                        'flex min-w-0 flex-1 items-center gap-2 rounded-[12px] bg-transparent px-4 py-2 text-left text-[13px] font-medium transition-colors',
                        isSelected ? 'text-zinc-900' : 'text-zinc-800'
                      ].join(' ')}
                      onClick={() => {
                        setOpen(false);
                        navigate(`/projects/${project.id}`);
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-zinc-200 bg-white text-[11px] font-semibold text-zinc-600"
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
              className="mt-1 flex w-full items-center gap-2 rounded-[12px] px-4 py-2.5 text-left text-[13px] font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              onClick={() => {
                setOpen(false);
                onOpenCreateProject?.();
              }}
            >
              <span className="text-[18px] leading-none">+</span>
              <span>새 프로젝트</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
