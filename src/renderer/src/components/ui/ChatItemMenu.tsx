import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { IconName } from '../icons/iconTypes';
import { useIsMobile } from '../../hooks/useMediaQuery';
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
  const isMobile = useIsMobile();

  const openMenu = (): void => {
    if (isMobile) {
      // 모바일에선 위치 계산 없이 하단 시트로 띄운다.
      setPos({ top: 0, left: 0 });
      setOpen(true);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const triggerRect = el.getBoundingClientRect();
    // 트리거는 채팅 row 안의 작은 ... 버튼이라 세로 center 로 offset 되어 있다.
    // 사용자 눈에는 "채팅 row 의 Y" 가 기준이므로 최근 조상 채팅 row(.group) 의 top 을 사용.
    const rowEl = el.closest<HTMLElement>('.group') ?? el;
    const rowRect = rowEl.getBoundingClientRect();
    const menuHeight = actions.length * ITEM_HEIGHT + MENU_PADDING_Y * 2;
    const viewportHeight = window.innerHeight;
    // Y: 채팅 row top 에 정렬. 하단 넘치면 뷰포트 안쪽으로 shift.
    let top = rowRect.top;
    if (top + menuHeight + VIEWPORT_MARGIN > viewportHeight) {
      top = Math.max(VIEWPORT_MARGIN, viewportHeight - menuHeight - VIEWPORT_MARGIN);
    }
    // X: 트리거 오른쪽 바깥에 붙임. 우측 오버플로 시 좌측 폴백.
    let left = triggerRect.right + 4;
    if (left + MENU_WIDTH + VIEWPORT_MARGIN > window.innerWidth) {
      left = Math.max(VIEWPORT_MARGIN, triggerRect.left - MENU_WIDTH - 4);
    }
    setPos({ top, left });
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
              className={
                isMobile
                  ? 'fixed inset-x-0 bottom-0 z-50 w-full rounded-t-2xl border-t border-line bg-surface p-2 shadow-lg'
                  : 'fixed z-50 w-[200px] rounded-lg border border-line bg-surface p-1 shadow-none'
              }
              style={isMobile ? undefined : { top: pos.top, left: pos.left }}
            >
              {actions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  role="menuitem"
                  disabled={action.disabled}
                  className={[
                    'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-caption max-sm:py-3 max-sm:text-label',
                    action.danger
                      ? 'text-fg-danger hover:bg-danger-soft'
                      : 'text-fg-default hover:bg-surface-muted',
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
