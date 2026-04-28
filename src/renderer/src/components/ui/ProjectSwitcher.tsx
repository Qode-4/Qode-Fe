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
  className?: string;
};

export const ProjectSwitcher = ({
  projects,
  selectedProjectId,
  onOpenCreateProject,
  className
}: Props): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedProjectLabel = useMemo(() => {
    const selectedProject = projects.find((project) => project.id === selectedProjectId);
    return selectedProject?.name?.trim() || '새 프로젝트';
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
          'flex min-w-0 items-center gap-2 rounded-[10px] px-2 py-1.5 text-left transition-colors',
          'hover:bg-zinc-100 active:bg-zinc-100'
        ].join(' ')}
        aria-label="프로젝트 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
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
            {projects.length === 0 ? (
              <div className="px-4 py-3 text-sm text-zinc-500">프로젝트가 없습니다.</div>
            ) : (
              projects.map((project) => {
                const isSelected = project.id === selectedProjectId;

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
                        'flex min-w-0 flex-1 items-center rounded-[12px] bg-transparent px-4 py-2 text-left text-[13px] font-medium transition-colors',
                        isSelected ? 'text-zinc-900' : 'text-zinc-800'
                      ].join(' ')}
                      onClick={() => {
                        setOpen(false);
                        navigate(`/projects/${project.id}`);
                      }}
                    >
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
