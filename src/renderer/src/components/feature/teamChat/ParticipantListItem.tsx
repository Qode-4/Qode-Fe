import type { ReactNode } from 'react';
import type { TeamChatParticipantRole } from '../../../api/contracts/teamChat';
import { Avatar } from '../../ui/Avatar';

type Props = {
  name?: string | null;
  role?: TeamChatParticipantRole;
  avatarUrl?: string | null;
  action?: ReactNode;
  emphasized?: boolean;
  /** radiogroup 처럼 목록이 아닌 역할의 부모 안에 둘 때 'none' — 안의 radio 가 그룹에 직접 속하게 한다 */
  itemRole?: 'none';
};

export const ParticipantListItem = ({
  name,
  role,
  avatarUrl,
  action,
  emphasized,
  itemRole
}: Props): React.JSX.Element => {
  return (
    <li
      role={itemRole}
      className={[
        'flex items-center gap-3 rounded-control px-2 py-2',
        emphasized ? 'bg-surface-muted' : ''
      ].join(' ')}
    >
      <Avatar name={name} src={avatarUrl} size="lg" tone="brand" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label font-medium text-fg-default">{name ?? '이름 없음'}</p>
      </div>
      {role === 'OWNER' ? (
        <span className="shrink-0 rounded-control bg-primary-soft px-2 py-0.5 text-micro font-semibold text-fg-primary">
          방장
        </span>
      ) : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </li>
  );
};
