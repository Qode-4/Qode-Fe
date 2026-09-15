import { useLayoutEffect, useRef } from 'react';
import { Icon } from './Icon';

// 질문 최대 길이. 명세 E-1 비기능 요구사항, 서버 sendUserMessageBodySchema 와 같은 값이다.
const MAX_LENGTH = 2000;

type Props = {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  canSend?: boolean;
  sendDisabledReason?: string;
  isSending?: boolean;
  className?: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttach?: () => void;
};

const MAX_ROWS = 5;

const sendButtonClass = [
  'inline-flex size-12 shrink-0 items-center justify-center rounded-[6px] text-primary-foreground transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-base focus-visible:ring-offset-2'
].join(' ');

export const ChatComposer = ({
  value,
  placeholder = '무엇이든 물어보세요!',
  disabled,
  canSend,
  sendDisabledReason,
  isSending,
  className,
  onChange,
  onSend
}: Props): React.JSX.Element => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const styles = window.getComputedStyle(el);
    const lineHeight = parseFloat(styles.lineHeight);
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingBottom = parseFloat(styles.paddingBottom);
    const maxHeight = lineHeight * MAX_ROWS + paddingTop + paddingBottom;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value]);

  const sendButtonBg = canSend
    ? 'bg-primary hover:bg-primary-strong active:bg-primary-strong'
    : 'bg-line';

  const sendButton = (
    <button
      type="button"
      className={[sendButtonClass, sendButtonBg].join(' ')}
      disabled={!canSend}
      onClick={onSend}
      aria-label="전송"
    >
      {isSending ? (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        <Icon name="Send_hor_fill" size="sm" decorative className="text-primary-foreground" />
      )}
    </button>
  );

  return (
    <div className={['flex w-full max-w-[48rem] items-start gap-2', className ?? ''].join(' ')}>
      <div className="min-w-0 flex-1 rounded-[6px] border border-control-line bg-surface px-3 py-3">
        <textarea
          ref={textareaRef}
          rows={1}
          aria-label="메시지 입력"
          className="block w-full resize-none bg-transparent text-base leading-[1.6] text-text-base outline-none placeholder:text-text-soft disabled:cursor-not-allowed"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={MAX_LENGTH}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
            e.preventDefault();
            onSend();
          }}
          disabled={disabled}
        />

        {value.length >= MAX_LENGTH ? (
          <p className="mt-1 text-ui-12 text-danger" role="status">
            최대 2,000자까지 입력 가능합니다.
          </p>
        ) : null}
      </div>

      {sendDisabledReason && !canSend ? (
        <span title={sendDisabledReason} tabIndex={0} aria-label={sendDisabledReason}>
          {sendButton}
        </span>
      ) : (
        sendButton
      )}
    </div>
  );
};
