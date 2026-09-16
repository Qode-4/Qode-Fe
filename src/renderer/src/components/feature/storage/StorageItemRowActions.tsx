import { useEffect, useRef, useState } from 'react';

type Props = {
  onEditClick: () => void;
  onDeleteClick: () => void;
};

export const StorageItemRowActions = ({ onEditClick, onDeleteClick }: Props): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const stop = (e: React.MouseEvent): void => e.stopPropagation();

  return (
    <div ref={ref} className="relative" onClick={stop}>
      <button
        type="button"
        className="h-7 w-7 rounded-md text-text-subtle hover:bg-surface-muted hover:text-text-base"
        aria-label="행 액션"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ⋯
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-8 z-10 min-w-[140px] rounded-md border border-line bg-surface py-1"
        >
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-text-base hover:bg-surface-muted"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEditClick();
            }}
          >
            제목 수정
          </button>
          <button
            role="menuitem"
            type="button"
            className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDeleteClick();
            }}
          >
            삭제
          </button>
        </div>
      ) : null}
    </div>
  );
};
