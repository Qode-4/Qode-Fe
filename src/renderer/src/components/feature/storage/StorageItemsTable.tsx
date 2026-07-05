import type { StorageItem, StorageItemType } from '../../../api/contracts/storageItems';
import { StorageItemRowActions } from './StorageItemRowActions';

type Props = {
  items: StorageItem[];
  onEdit: (item: StorageItem) => void;
  onDelete: (item: StorageItem) => void;
};

const TYPE_LABEL: Record<StorageItemType, string> = {
  github_repo: 'GitHub',
  figma: 'Figma',
  figjam: 'FigJam'
};

const TYPE_ICON: Record<StorageItemType, string> = {
  github_repo: '🐙',
  figma: '🎨',
  figjam: '🧠'
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const stripProtocol = (url: string): string => url.replace(/^https?:\/\//, '');

export const StorageItemsTable = ({ items, onEdit, onDelete }: Props): React.JSX.Element => {
  const openUrl = (url: string): void => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-muted text-xs text-text-soft">
          <tr>
            <th className="px-3 py-2 text-left font-medium">타입</th>
            <th className="px-3 py-2 text-left font-medium">제목</th>
            <th className="px-3 py-2 text-left font-medium">URL</th>
            <th className="px-3 py-2 text-left font-medium">등록자</th>
            <th className="px-3 py-2 text-left font-medium">등록일</th>
            <th className="w-10 px-3 py-2" aria-label="액션" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="cursor-pointer border-t border-line hover:bg-surface-muted"
              onClick={() => openUrl(item.url)}
            >
              <td className="px-3 py-2 text-text-base">
                <span className="mr-1">{TYPE_ICON[item.type]}</span>
                {TYPE_LABEL[item.type]}
              </td>
              <td className="px-3 py-2 font-medium text-text-base">{item.title}</td>
              <td className="px-3 py-2 text-text-subtle" title={item.url}>
                <span className="block max-w-[360px] truncate">{stripProtocol(item.url)}</span>
              </td>
              <td className="px-3 py-2 text-text-base">{item.createdBy.name}</td>
              <td className="px-3 py-2 text-text-subtle">{formatDate(item.createdAt)}</td>
              <td className="px-3 py-2">
                <StorageItemRowActions
                  onEditClick={() => onEdit(item)}
                  onDeleteClick={() => onDelete(item)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
