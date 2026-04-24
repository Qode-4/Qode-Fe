import { useEffect, useMemo, useState } from 'react';
import { usePatchStorageItemTitle } from '../../../api/auth/useStorageItemsAPI';
import { handleApiError } from '../../../api/axios';
import type { StorageItem } from '../../../api/contracts/storageItems';
import { Button } from '../../ui/Button';
import { InlineAlert } from '../../ui/InlineAlert';
import { OverlayModal } from '../../ui/OverlayModal';

type Props = {
  open: boolean;
  projectId: string;
  item: StorageItem | null;
  onClose: () => void;
};

export const EditStorageItemTitleModal = ({
  open,
  projectId,
  item,
  onClose
}: Props): React.JSX.Element | null => {
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);
  const patch = usePatchStorageItemTitle({ projectId });

  useEffect(() => {
    if (item) setTitle(item.title);
  }, [item]);

  const titleError = useMemo(
    () => (touched && !title.trim() ? '제목을 입력해주세요.' : ''),
    [title, touched]
  );

  if (!item) return null;

  const resetAndClose = (): void => {
    setTouched(false);
    patch.reset();
    onClose();
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setTouched(true);
    const trimmed = title.trim();
    if (!trimmed) return;
    patch.mutate(
      { id: item.id, body: { title: trimmed } },
      {
        onSuccess: () => resetAndClose()
      }
    );
  };

  return (
    <OverlayModal
      open={open}
      onClose={resetAndClose}
      title="제목 수정"
      widthClassName="max-w-[420px]"
    >
      <form onSubmit={onSubmit}>
        <label className="block" htmlFor="edit-storage-title">
          <span className="mb-1 block text-xs font-medium text-text-soft">제목</span>
          <input
            id="edit-storage-title"
            className={[
              'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
              titleError
                ? 'border-danger-line focus:border-danger'
                : 'border-[#737983] focus:border-primary'
            ].join(' ')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            autoFocus
          />
          {titleError ? (
            <span className="mt-1 block text-xs text-danger">{titleError}</span>
          ) : null}
        </label>

        {patch.isError ? (
          <div className="mt-3">
            <InlineAlert tone="danger" title="수정 실패">
              {handleApiError(patch.error).message}
            </InlineAlert>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={resetAndClose}>
            취소
          </Button>
          <Button type="submit" size="sm" isLoading={patch.isPending}>
            저장
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
