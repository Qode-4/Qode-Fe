import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { IconName } from '../icons/iconTypes';
import { Icon } from './Icon';

export type ChatItemMenuAction = {
  key: string;
  label: string;
  iconName?: IconName;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type Props = {
  actions: ChatItemMenuAction[];
  ariaLabel?: string;
  triggerAriaLabel: string;
  triggerClassName?: string;
};

const VIEWPORT_MARGIN = 8;
const MENU_WIDTH = 200;
const ITEM_HEIGHT = 32;
const MENU_PADDING_Y = 8;

export const ChatItemMenu = ({
  actions,
  ariaLabel = '채팅 작업 메뉴',
  triggerAriaLabel,
  triggerClassName
}: Props): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = (): void => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuHeight = actions.length * ITEM_HEIGHT + MENU_PADDING_Y * 2;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const top =
      spaceBelow >= menuHeight + VIEWPORT_MARGIN ? rect.bottom + 4 : rect.top - menuHeight - 4;
    const left = Math.min(
      rect.right - MENU_WIDTH,
      window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN
    );
    setPos({ top, left: Math.max(VIEWPORT_MARGIN, left) });
    setOpen(true);
  };

  const closeMenu = (): void => {
    setOpen(false);
    setPos(null);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-chat-item-menu]')) return;
      if (target.closest('[data-chat-item-menu-trigger]')) return;
      closeMenu();
    };

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        closeMenu();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerAriaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        data-chat-item-menu-trigger
        className={triggerClassName}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) closeMenu();
          else openMenu();
        }}
      >
        <Icon name="More_horizontal_light" size="sm" decorative />
      </button>

      {open && pos
        ? createPortal(
            <div
              data-chat-item-menu
              role="menu"
              aria-label={ariaLabel}
              className="fixed z-50 w-[200px] rounded-lg border border-line bg-surface p-1 shadow-lg"
              style={{ top: pos.top, left: pos.left }}
            >
              {actions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  role="menuitem"
                  disabled={action.disabled}
                  className={[
                    'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs',
                    action.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-text-base hover:bg-surface-muted',
                    action.disabled ? 'opacity-50' : ''
                  ].join(' ')}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeMenu();
                    action.onSelect();
                  }}
                >
                  {action.iconName ? (
                    <Icon name={action.iconName} size="sm" decorative className="shrink-0" />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
};
