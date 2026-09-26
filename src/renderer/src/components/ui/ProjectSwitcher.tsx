import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../../lib/hashRouter';
import { cn } from '../../lib/cn';

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

/**
 * ProjectSwitcher — 현재 프로젝트 표시와 전환.
 * ✅ Use: 사이드바 상단 한 곳. 목록 맨 아래 '+ 새 프로젝트'.
 * ❌ Don't: 다른 곳에서 프로젝트 선택이 필요하면 새로 만들지 말고
 *          이 컴포넌트를 쓰거나 목록 데이터를 재사용한다.
 * 키보드: Enter/Space/↓ 열기 · ↑↓ Home End 이동 · Enter 선택 · Esc 닫기
 */
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const menuItems = (): HTMLElement[] =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') ?? []
    );

  const closeMenu = (returnFocus: boolean): void => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  // 열리면 현재 프로젝트(없으면 첫 항목)에 포커스
  useEffect(() => {
    if (!open) return;
    const items = menuItems();
    (items.find((el) => el.getAttribute('aria-checked') === 'true') ?? items[0])?.focus();
  }, [open]);

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const items = menuItems();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move = (next: number): void => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };
    if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(items.length - 1);
    else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === 'Tab') closeMenu(false);
  };

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
    <div ref={containerRef} className={cn('relative min-w-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'flex h-9 w-full min-w-0 items-center gap-2 rounded-control border border-line bg-surface px-2 text-left transition-colors',
          'hover:bg-surface-muted active:bg-surface-muted'
        )}
        aria-label="프로젝트 선택"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span
          aria-hidden="true"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-caption font-semibold text-fg-subtle"
        >
          {getInitialCharacter(selectedProjectLabel)}
        </span>
        <span className="min-w-0 flex-1 truncate text-label font-normal text-fg-default">
          {selectedProjectLabel}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 text-caption leading-none text-fg-muted transition-transform',
            open ? 'rotate-180 text-fg-subtle' : ''
          )}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full min-w-[220px] overflow-hidden rounded-control border border-line bg-surface py-1 shadow-none max-sm:min-w-0">
          <div
            ref={menuRef}
            role="menu"
            aria-label="내 프로젝트 목록"
            className="max-h-[420px] overflow-y-auto px-1"
            onKeyDown={onMenuKeyDown}
          >
            {isError ? (
              <div className="px-2 py-2" role="alert">
                <p className="mb-2 px-2 text-body text-fg-subtle">
                  프로젝트 목록을 불러올 수 없습니다.
                </p>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full rounded-panel border border-line px-3 py-2 text-body font-medium text-fg-default transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
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
                    className={cn(
                      'group flex items-center gap-1 rounded-control transition-colors',
                      isSelected ? 'bg-surface-muted' : 'hover:bg-surface-muted'
                    )}
                  >
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-control bg-transparent px-2 py-1.5 text-left text-body font-medium text-fg-default transition-colors outline-none focus-visible:ring-2 focus-visible:ring-fg-default"
                      onClick={() => {
                        closeMenu(true);
                        navigate(`/projects/${project.id}`);
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="inline-flex size-5 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-caption font-semibold text-fg-subtle"
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
              role="menuitem"
              className="mt-1 flex w-full items-center gap-2 rounded-panel px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-fg-default text-left text-body font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg-subtle"
              onClick={() => {
                closeMenu(false);
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
