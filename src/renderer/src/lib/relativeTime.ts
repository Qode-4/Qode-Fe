// 미래·잘못된 값은 조용히 `방금 전`으로 잡는다 — 사용자 노출용이라 이상하면 안 된다.
export const formatRelativeTime = (
  iso: string | null | undefined,
  now: Date = new Date()
): string => {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';

  const diffSec = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diffSec < 60) return '방금 전';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;

  const yyyy = then.getFullYear();
  const mm = String(then.getMonth() + 1).padStart(2, '0');
  const dd = String(then.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
