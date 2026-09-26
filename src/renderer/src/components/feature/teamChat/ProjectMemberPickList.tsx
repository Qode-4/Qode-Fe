import { useMemo, useState } from 'react';
import { Avatar } from '../../ui/Avatar';
import { StateMessage } from '../../ui/StateMessage';

export type PickListMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type Props = {
  members: PickListMember[];
  selectedIds: string[];
  excludedIds?: string[];
  onToggle: (memberId: string) => void;
  min?: number;
  max?: number;
  emptyMessage?: string;
  /** 목록을 불러오는 중일 때 빈 상태 대신 보여줄 문구 */
  loadingMessage?: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
};

export const ProjectMemberPickList = ({
  members,
  selectedIds,
  excludedIds = [],
  onToggle,
  max,
  emptyMessage = '검색 결과가 없어요.',
  loadingMessage,
  searchPlaceholder = '이름 검색',
  ariaLabel = '멤버 선택 목록'
}: Props): React.JSX.Element => {
  const [query, setQuery] = useState('');

  const excludedSet = useMemo(() => new Set(excludedIds), [excludedIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const visibleMembers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const list = members.filter((member) => !excludedSet.has(member.id));
    if (!trimmed) return list;
    return list.filter((member) => member.name.toLowerCase().includes(trimmed));
  }, [members, excludedSet, query]);

  const atMax = max != null && selectedSet.size >= max;

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <label className="block">
        <span className="sr-only">멤버 검색</span>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label="멤버 이름으로 검색"
          className="h-9 w-full rounded-control border border-line-strong bg-surface px-3 text-label text-fg-default outline-none focus:border-line-primary"
        />
      </label>

      <ul
        role="listbox"
        aria-label={ariaLabel}
        aria-multiselectable
        className="max-h-[280px] min-h-[80px] overflow-y-auto rounded-control border border-line bg-surface"
      >
        {loadingMessage ? (
          <li className="px-3 py-6">
            <StateMessage kind="loading" align="center">
              {loadingMessage}
            </StateMessage>
          </li>
        ) : visibleMembers.length === 0 ? (
          <li className="px-3 py-6">
            <StateMessage kind="empty" align="center">
              {emptyMessage}
            </StateMessage>
          </li>
        ) : (
          visibleMembers.map((member) => {
            const isSelected = selectedSet.has(member.id);
            const disabled = !isSelected && atMax;
            return (
              <li key={member.id} role="option" aria-selected={isSelected}>
                <label
                  className={[
                    'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors',
                    disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-surface-muted'
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => onToggle(member.id)}
                    aria-label={`${member.name} 선택`}
                  />
                  <Avatar name={member.name} src={member.avatarUrl} size="md" tone="brand" />
                  <span className="min-w-0 flex-1 truncate text-label text-fg-default">
                    {member.name}
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
