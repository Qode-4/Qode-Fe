import { useState } from 'react';
import {
  useDeleteStorageItem,
  useGetStorageItems
} from '../api/auth/useStorageItemsAPI';
import { handleApiError } from '../api/axios';
import type { StorageItem, StorageItemType } from '../api/contracts/storageItems';
import { AddStorageItemModal } from '../components/feature/storage/AddStorageItemModal';
import { EditStorageItemTitleModal } from '../components/feature/storage/EditStorageItemTitleModal';
import { StorageItemsTable } from '../components/feature/storage/StorageItemsTable';
import { ProjectTabs } from '../components/layout/ProjectTabs';
import { Button } from '../components/ui/Button';
import { InlineAlert } from '../components/ui/InlineAlert';

type Props = {
  projectId: string;
};

export const StoragePage = ({ projectId }: Props): React.JSX.Element => {
  const items = useGetStorageItems({ projectId });
  const deleteItem = useDeleteStorageItem({ projectId });

  const [addType, setAddType] = useState<StorageItemType | null>(null);
  const [editItem, setEditItem] = useState<StorageItem | null>(null);

  const onDelete = (item: StorageItem): void => {
    if (!window.confirm(`"${item.title}" 저장소 아이템을 삭제할까요?`)) return;
    deleteItem.mutate(item.id);
  };

  const data = items.data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <ProjectTabs projectId={projectId} current="storage" />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-base">저장소</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setAddType('github_repo')}>
            + GitHub 레포
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAddType('figma')}>
            + Figma
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAddType('figjam')}>
            + FigJam
          </Button>
        </div>
      </div>

      {items.isError ? (
        <InlineAlert tone="danger" title="저장소 조회 실패">
          {handleApiError(items.error).message}
        </InlineAlert>
      ) : null}

      {deleteItem.isError ? (
        <InlineAlert tone="danger" title="삭제 실패">
          {handleApiError(deleteItem.error).message}
        </InlineAlert>
      ) : null}

      {items.isLoading ? (
        <div className="rounded-xl border border-line bg-surface">
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-surface-muted" />
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="text-sm text-text-subtle">
            아직 등록된 저장소가 없어요. 위 버튼으로 추가해보세요.
          </p>
        </div>
      ) : (
        <StorageItemsTable items={data} onEdit={setEditItem} onDelete={onDelete} />
      )}

      <AddStorageItemModal
        open={addType !== null}
        projectId={projectId}
        type={addType}
        onClose={() => setAddType(null)}
      />
      <EditStorageItemTitleModal
        open={editItem !== null}
        projectId={projectId}
        item={editItem}
        onClose={() => setEditItem(null)}
      />
    </div>
  );
};
