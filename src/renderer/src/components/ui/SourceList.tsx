import React, { useId, useState } from 'react';
import { cn } from '../../lib/cn';
import { formatRange, groupSources, type SourceRef } from '../../lib/groupSources';

/**
 * SourceList — AI 답변이 참조한 코드 위치 목록. 같은 파일은 한 줄로 묶는다.
 * ✅ Use: 답변·요약 카드 아래 참조 소스 표기 (메인 채팅, 원본 대화, 팀 공유 카드, 공유 미리보기).
 * ❌ Don't: 코드 본문 미리보기에는 CodeBlock. 파일 탐색 목록처럼 클릭 이동이 필요한 곳엔 쓰지 않는다.
 *    실제 응답에 없는 소스·줄 번호를 채워 넣지 않는다.
 */
type SourceListProps = {
  sources: readonly SourceRef[];
  title?: string;
  defaultExpanded?: boolean;
  /** 목록 최대 높이(CSS 값). 모달처럼 세로 공간이 제한된 곳에서만 준다. */
  maxHeight?: string;
  className?: string;
};

const MAX_VISIBLE_RANGES = 3;

export const SourceList = ({
  sources,
  title = '참조 코드',
  defaultExpanded = true,
  maxHeight,
  className
}: SourceListProps): React.JSX.Element | null => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const listId = useId();
  const groups = groupSources(sources);
  if (groups.length === 0) return null;

  return (
    <section
      className={cn('overflow-hidden rounded-card border border-line bg-surface', className)}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-caption text-fg-muted transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-fg-default focus-visible:outline-none"
      >
        <span className="font-medium text-fg-subtle">{title}</span>
        <span aria-hidden>·</span>
        <span>파일 {groups.length}개</span>
      </button>
      {expanded ? (
        <ul
          id={listId}
          className="overflow-y-auto border-t border-line-soft py-1"
          style={maxHeight ? { maxHeight } : undefined}
        >
          {groups.map((g) => {
            const visible = g.ranges.slice(0, MAX_VISIBLE_RANGES);
            const hidden = g.ranges.length - visible.length;
            const allRanges = g.ranges.map(formatRange).join(', ');
            return (
              <li
                key={g.filePath}
                title={allRanges ? `${g.filePath} (${allRanges})` : g.filePath}
                className="flex items-baseline gap-2 px-3 py-0.5 text-caption"
              >
                <span className="max-w-[60%] shrink-0 truncate font-medium text-fg-default">
                  {g.fileName}
                </span>
                <span className="min-w-0 flex-1 truncate text-fg-muted">{g.dir}</span>
                {visible.length > 0 ? (
                  <span className="shrink-0 text-fg-muted tabular-nums">
                    {visible.map(formatRange).join(' · ')}
                    {hidden > 0 ? ` +${hidden}` : ''}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
};
