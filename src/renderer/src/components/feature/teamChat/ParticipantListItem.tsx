import type { ReactNode } from 'react';
import type { TeamChatParticipantRole } from '../../../api/contracts/teamChat';

type Props = {
  name?: string | null;
  role?: TeamChatParticipantRole;
  avatarUrl?: string | null;
  action?: ReactNode;
  emphasized?: boolean;
};

const initialOf = (name?: string | null): string => {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
};

const Avatar = ({
  name,
  avatarUrl
}: {
  name?: string | null;
  avatarUrl?: string | null;
}): React.JSX.Element => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        aria-hidden
        className="size-8 rounded-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-caption font-semibold text-fg-primary"
    >
      {initialOf(name)}
    </span>
  );
};

export const ParticipantListItem = ({
  name,
  role,
  avatarUrl,
  action,
  emphasized
}: Props): React.JSX.Element => {
  return (
    <li
      className={[
        'flex items-center gap-3 rounded-md px-2 py-2',
        emphasized ? 'bg-surface-muted' : ''
      ].join(' ')}
    >
      <Avatar name={name} avatarUrl={avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label font-medium text-fg-default">{name ?? '이름 없음'}</p>
      </div>
      {role === 'OWNER' ? (
        <span className="shrink-0 rounded-md bg-primary-soft px-2 py-0.5 text-micro font-semibold text-fg-primary">
          방장
        </span>
      ) : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </li>
  );
};
