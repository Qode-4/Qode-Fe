import type { SourceItem } from '../../../api/contracts/chats';
import { Button } from '../../ui/Button';
import { ChatItemMenu, type ChatItemMenuAction } from '../../ui/ChatItemMenu';
import { Icon } from '../../ui/Icon';
import { MarkdownAnswer } from '../../ui/MarkdownAnswer';

// 팀채팅에 도착한 개인채팅 답변 요약 공유 카드.
// 일반 팀채팅 메시지(회색/유저 말풍선)와 시각적으로 구분해 카드 형태로 렌더한다.
// - 헤더: [공유] 배지 + 공유자 이름 + 시간
// - 본문: 마크다운 요약 + 참조 코드 리스트
// - 액션: "원본 대화 보기" (BE 신규 API 붙기 전엔 disabled/알림), 케밥 → "공유 취소"(공유자 본인만)

type Props = {
  content: string;
  sources: SourceItem[];
  senderName: string;
  senderInitial?: string;
  createdAt: string;
  isMe: boolean;
  hasSourceLink?: boolean;
  onOpenSource?: () => void;
  onDeleteShare?: () => void;
  isDeleting?: boolean;
};

const formatTime = (iso: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const DigestSharedCard = ({
  content,
  sources,
  senderName,
  senderInitial,
  createdAt,
  isMe,
  hasSourceLink,
  onOpenSource,
  onDeleteShare,
  isDeleting
}: Props): React.JSX.Element => {
  const time = formatTime(createdAt);
  const initial = (senderInitial ?? senderName.charAt(0) ?? '?').toUpperCase();

  const menuActions: ChatItemMenuAction[] = isMe
    ? [
        {
          key: 'delete-share',
          label: '공유 취소',
          iconName: 'Trash_light',
          danger: true,
          disabled: isDeleting,
          onSelect: () => onDeleteShare?.()
        }
      ]
    : [];

  return (
    <div className="group flex items-start gap-2">
      <div className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-ui-12 font-medium text-text-soft">
        {initial}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2 text-ui-10">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
            <Icon name="shared" size="sm" decorative />팀 공유
          </span>
          <span className="font-medium text-text-soft">{senderName}</span>
          {time ? <span className="text-text-soft">· {time}</span> : null}
          {menuActions.length > 0 ? (
            <div className="ml-auto">
              <ChatItemMenu
                actions={menuActions}
                ariaLabel="공유 카드 메뉴"
                triggerAriaLabel="공유 카드 메뉴 열기"
                triggerClassName="rounded-md p-1 text-text-soft hover:bg-surface-muted"
              />
            </div>
          ) : null}
        </div>

        <article className="rounded-[12px] border border-line bg-surface p-3">
          <MarkdownAnswer content={content} />

          {sources.length > 0 ? (
            <section className="mt-3 rounded-[8px] border border-line bg-surface-muted p-2">
              <h3 className="mb-1 text-ui-10 font-semibold text-text-soft">
                참조 코드 {sources.length}개
              </h3>
              <ul className="flex flex-col gap-0.5">
                {sources.map((s, idx) => (
                  <li
                    key={`${s.filePath}-${s.startLine ?? 0}-${idx}`}
                    className="flex items-center justify-between gap-2 text-ui-10 text-text-soft"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <code className="rounded bg-surface px-1 py-0.5">{s.filePath}</code>
                    </span>
                    <span className="shrink-0">
                      ({s.startLine ?? '-'}-{s.endLine ?? '-'})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!hasSourceLink || !onOpenSource}
              title={
                !hasSourceLink
                  ? '이 카드에는 원본 대화 링크가 없습니다.'
                  : '공유된 답변의 원본 대화를 보여줍니다.'
              }
              onClick={onOpenSource}
            >
              원본 대화 보기
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
};
