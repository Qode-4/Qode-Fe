import { useMemo, useState } from 'react';
import { usePostStorageItem } from '../../../api/auth/useStorageItemsAPI';
import { friendlyErrorMessage } from '../../../api/errorMessages';
import type { CreateStorageItemBody } from '../../../api/contracts/storageItems';

type SimpleAddType = 'figma' | 'figjam';
import { useToast } from '../../../hooks/useToast';
import { parseStorageUrl } from '../../../lib/parseStorageUrl';
import { Button } from '../../ui/Button';
import { OverlayModal } from '../../ui/OverlayModal';

type Props = {
  open: boolean;
  projectId: string;
  type: SimpleAddType | null;
  onClose: () => void;
};

const TITLE_MAP: Record<SimpleAddType, string> = {
  figma: 'Figma 디자인 추가',
  figjam: 'FigJam 보드 추가'
};

const URL_PLACEHOLDER: Record<SimpleAddType, string> = {
  figma: 'https://www.figma.com/design/xxxxx/...',
  figjam: 'https://www.figma.com/board/xxxxx/...'
};

const URL_HINT: Record<SimpleAddType, string> = {
  figma: 'Figma design URL',
  figjam: 'FigJam board URL'
};

export const AddStorageItemModal = ({
  open,
  projectId,
  type,
  onClose
}: Props): React.JSX.Element | null => {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);
  const post = usePostStorageItem({ projectId });

  const parsed = useMemo(() => {
    if (!type) return null;
    return parseStorageUrl(type, url);
  }, [type, url]);

  if (!type) return null;

  const urlError = touched && url.trim() && !parsed ? `${URL_HINT[type]} 형식이 아닙니다.` : '';
  const titleError = touched && !title.trim() ? '제목을 입력해주세요.' : '';

  const resetAndClose = (): void => {
    setUrl('');
    setTitle('');
    setTouched(false);
    post.reset();
    onClose();
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setTouched(true);
    if (!parsed || !title.trim()) return;

    const body = {
      type: parsed.type,
      title: title.trim(),
      url: parsed.url,
      metadata: parsed.metadata
    } as CreateStorageItemBody;

    post.mutate(body, {
      onSuccess: () => resetAndClose(),
      onError: (error) => {
        toast.error(friendlyErrorMessage(error, 'storage.create'));
      }
    });
  };

  return (
    <OverlayModal
      open={open}
      onClose={resetAndClose}
      title={TITLE_MAP[type]}
      widthClassName="max-w-[480px]"
    >
      <form onSubmit={onSubmit}>
        <label className="block" htmlFor="storage-item-url">
          <span className="mb-1 block text-xs font-medium text-text-soft">URL</span>
          <input
            id="storage-item-url"
            className={[
              'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
              urlError ? 'border-danger' : 'border-control-line focus:border-primary'
            ].join(' ')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={URL_PLACEHOLDER[type]}
            autoFocus
          />
          {urlError ? <span className="mt-1 block text-xs text-danger">{urlError}</span> : null}
          {parsed && parsed.type !== 'github_repo' ? (
            <span className="mt-1 block text-xs text-text-subtle">
              {parsed.type === 'figma'
                ? `감지됨: fileKey=${parsed.metadata.fileKey}${
                    parsed.metadata.nodeId ? `, nodeId=${parsed.metadata.nodeId}` : ''
                  }`
                : `감지됨: fileKey=${parsed.metadata.fileKey}`}
            </span>
          ) : null}
        </label>

        <label className="mt-3 block" htmlFor="storage-item-title">
          <span className="mb-1 block text-xs font-medium text-text-soft">제목</span>
          <input
            id="storage-item-title"
            className={[
              'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
              titleError ? 'border-danger' : 'border-control-line focus:border-primary'
            ].join(' ')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 프론트 레포"
          />
          {titleError ? <span className="mt-1 block text-xs text-danger">{titleError}</span> : null}
        </label>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={resetAndClose}>
            취소
          </Button>
          <Button type="submit" size="sm" isLoading={post.isPending}>
            추가
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
