import { Icon } from './Icon';

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

export const ChatComposer = ({
  value,
  placeholder = '메시지를 입력하세요...',
  disabled,
  canSend,
  sendDisabledReason,
  isSending,
  className,
  onChange,
  onSend
  // onAttach
}: Props): React.JSX.Element => {
  return (
    <div
      className={[
        'rounded-[12px] border border-zinc-200 bg-white p-3 shadow-[0px_4px_18.7px_0px_rgba(0,0,0,0.08)]',
        className ?? ''
      ].join(' ')}
    >
      <textarea
        aria-label="메시지 입력"
        className="block h-[72px] w-full resize-none bg-transparent text-[12px] leading-[1.6] text-zinc-800 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.shiftKey) return;
          e.preventDefault();
          onSend();
        }}
        disabled={disabled}
      />

      <div className="mt-3 flex items-center justify-end">
        {/* <IconButton
          size="lg"
          name="Add_round_light"
          aria-label="첨부"
          onClick={onAttach}
          disabled={disabled}
        /> */}

        {sendDisabledReason && !canSend ? (
          <span title={sendDisabledReason} tabIndex={0} aria-label={sendDisabledReason}>
            <button
              type="button"
              className={[
                'inline-flex size-7 items-center justify-center rounded-[8px] text-white transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                canSend ? 'bg-zinc-700 hover:bg-zinc-800 active:bg-zinc-900' : 'bg-zinc-200'
              ].join(' ')}
              disabled={!canSend}
              onClick={onSend}
              aria-label="전송"
            >
              {isSending ? (
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
              ) : (
                <Icon name="Send_hor_fill" size="sm" decorative className="text-white" />
              )}
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={[
              'inline-flex size-7 items-center justify-center rounded-[8px] text-white transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              canSend ? 'bg-zinc-700 hover:bg-zinc-800 active:bg-zinc-900' : 'bg-zinc-200'
            ].join(' ')}
            disabled={!canSend}
            onClick={onSend}
            aria-label="전송"
          >
            {isSending ? (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
            ) : (
              <Icon name="Send_hor_fill" size="sm" decorative className="text-white" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
