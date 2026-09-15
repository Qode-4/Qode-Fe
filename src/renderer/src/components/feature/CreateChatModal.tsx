import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { OverlayModal } from '../ui/OverlayModal';

type Props = {
  open: boolean;
  type: 'personal' | 'team' | null;
  onClose: () => void;
  onSubmit: (input: { type: 'personal' | 'team'; name: string }) => void;
  isSubmitting?: boolean;
};

export const CreateChatModal = ({
  open,
  type,
  onClose,
  onSubmit,
  isSubmitting
}: Props): React.JSX.Element | null => {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const title = type === 'team' ? '팀 채팅 생성' : '개인 채팅 생성';
  const placeholder = type === 'team' ? '새 팀 채팅' : '새 개인 채팅';

  const nameError = useMemo(() => {
    if (!touched) return '';
    if (!name.trim()) return '채팅 이름을 입력해주세요.';
    return '';
  }, [name, touched]);

  if (!type) return null;

  const resetAndClose = (): void => {
    setName('');
    setTouched(false);
    onClose();
  };

  return (
    <OverlayModal open={open} onClose={resetAndClose} title={title} widthClassName="max-w-[460px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!name.trim()) return;
          onSubmit({ type, name: name.trim() });
        }}
      >
        <label className="block" htmlFor="create-chat-name">
          <span className="mb-1 block text-xs font-medium text-text-soft">이름</span>
          <input
            id="create-chat-name"
            className={[
              'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
              nameError
                ? 'border-danger-line focus:border-danger'
                : 'border-control-line focus:border-primary'
            ].join(' ')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={placeholder}
            autoFocus
          />
          {nameError ? <span className="mt-1 block text-xs text-danger">{nameError}</span> : null}
        </label>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={resetAndClose}>
            취소
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            생성
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
