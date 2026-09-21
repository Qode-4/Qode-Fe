import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDigestPreview, useDigestShare } from '../../../api/auth/useDigestAPI';
import { useGetProjectChats } from '../../../api/auth/useChatsAPI';
import type { ChatMessage } from '../../../api/contracts/chats';
import { Button } from '../../ui/Button';
import { OverlayModal } from '../../ui/OverlayModal';
import { Step1SelectAndNote } from './Step1SelectAndNote';
import { Step2SummaryPreview } from './Step2SummaryPreview';
import { Step3TargetRoom, type Step3ChatOption } from './Step3TargetRoom';
import { buildStep1Pairs } from './pairs';
import { handleApiError } from '../../../api/axios';
import { useToast } from '../../../hooks/useToast';

type Props = {
  open: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  projectId: string;
  messages: ChatMessage[];
  initialSelectedIds: Set<string>;
  onShared?: (targetChatId: string) => void;
};

type Step = 1 | 2 | 3;

const stepLabels: Record<Step, string> = {
  1: '대화 선택',
  2: '요약 확인',
  3: '팀채팅 선택'
};

const buildPreviewKey = (ids: string[], note: string): string =>
  `${[...ids].sort().join('|')}::${note.trim()}`;

export const ShareToTeamChatModal = ({
  open,
  onClose,
  chatId,
  chatName,
  projectId,
  messages,
  initialSelectedIds,
  onShared
}: Props): React.JSX.Element | null => {
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [note, setNote] = useState('');
  const [targetChatId, setTargetChatId] = useState<string | null>(null);
  const [lastPreviewKey, setLastPreviewKey] = useState<string | null>(null);

  const preview = useDigestPreview({ chatId });
  const { reset: resetPreview } = preview;
  const share = useDigestShare({ chatId, projectId });
  const teamChatsQuery = useGetProjectChats({
    projectId,
    type: 'team',
    enabled: open && step === 3
  });

  // open 이 false→true 로 바뀌는 전이에서만 폼 상태를 initial prop 으로 리셋한다.
  // React 정공법은 부모가 key remount 로 초기화하는 것이지만, 이 프로젝트의 다른 모달들이
  // open prop 을 유지한 채 열고 닫는 컨벤션이라 여기서 sync 한다.
  const prevOpenRef = useRef(false);
  const resetForm = useCallback((): void => {
    setStep(1);
    setSelectedIds(new Set(initialSelectedIds));
    setNote('');
    setTargetChatId(null);
    setLastPreviewKey(null);
    resetPreview();
  }, [initialSelectedIds, resetPreview]);
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (open && !wasOpen) {
      resetForm();
    }
  }, [open, resetForm]);

  const pairs = useMemo(() => buildStep1Pairs(messages, selectedIds), [messages, selectedIds]);

  const orderedMessageIds = useMemo(() => pairs.map((p) => p.messageId), [pairs]);

  const teamChatOptions: Step3ChatOption[] = useMemo(() => {
    const raw = teamChatsQuery.data?.data ?? [];
    return raw.filter((c) => c.chat_type === 'TEAM').map((c) => ({ id: c.id, name: c.name }));
  }, [teamChatsQuery.data]);

  const step3Status: 'loading' | 'error' | 'ready' = teamChatsQuery.isPending
    ? 'loading'
    : teamChatsQuery.isError
      ? 'error'
      : 'ready';

  const canGoNextFromStep1 = selectedIds.size >= 1;
  const canGoNextFromStep2 = preview.status === 'done' && preview.content.length > 0;
  const canShareFromStep3 = targetChatId != null && preview.content.length > 0;

  const handleToggle = (messageId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        if (next.size <= 1) return prev; // 마지막 하나 방어
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      // 선택이 바뀌면 preview 캐시는 다음 진입 시 다시 뽑는다.
      setLastPreviewKey(null);
      return next;
    });
  };

  const startPreviewIfNeeded = (): void => {
    const key = buildPreviewKey(orderedMessageIds, note);
    if (key === lastPreviewKey && preview.status === 'done') return;
    setLastPreviewKey(key);
    void preview.start({
      message_ids: orderedMessageIds,
      ...(note.trim() ? { note: note.trim() } : {})
    });
  };

  const handleRegenerate = (): void => {
    const key = buildPreviewKey(orderedMessageIds, note);
    setLastPreviewKey(key);
    void preview.start({
      message_ids: orderedMessageIds,
      ...(note.trim() ? { note: note.trim() } : {})
    });
  };

  const handleShare = (): void => {
    if (!targetChatId) return;
    share.mutate(
      {
        target_chat_id: targetChatId,
        content: preview.content,
        sources: preview.sources,
        message_ids: orderedMessageIds,
        ...(note.trim() ? { note: note.trim() } : {})
      },
      {
        onSuccess: () => {
          toast.success('팀채팅에 공유했어요');
          onShared?.(targetChatId);
          onClose();
        },
        onError: (err) => {
          toast.error(handleApiError(err).message);
        }
      }
    );
  };

  return (
    <OverlayModal
      open={open}
      onClose={onClose}
      title="팀에 공유하기"
      widthClassName="max-w-[640px]"
      footer={
        <FooterActions
          step={step}
          onBack={() => {
            if (step === 2) setStep(1);
            if (step === 3) setStep(2);
          }}
          onNext={() => {
            if (step === 1) {
              setStep(2);
              startPreviewIfNeeded();
            } else if (step === 2) {
              setStep(3);
            }
          }}
          onShare={handleShare}
          onCancel={onClose}
          canNext={step === 1 ? canGoNextFromStep1 : step === 2 ? canGoNextFromStep2 : false}
          canShare={canShareFromStep3}
          isSharing={share.isPending}
          chatName={chatName}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <StepIndicator current={step} />

        {step === 1 ? (
          <Step1SelectAndNote
            pairs={pairs}
            selectedIds={selectedIds}
            note={note}
            onToggle={handleToggle}
            onNoteChange={setNote}
          />
        ) : null}

        {step === 2 ? (
          <Step2SummaryPreview
            status={preview.status}
            content={preview.content}
            sources={preview.sources}
            error={preview.error}
            retriesRemaining={preview.retriesRemaining}
            onRegenerate={handleRegenerate}
            onRetry={() => void preview.retry()}
          />
        ) : null}

        {step === 3 ? (
          <Step3TargetRoom
            status={step3Status}
            chats={teamChatOptions}
            selectedChatId={targetChatId}
            onSelect={setTargetChatId}
            onRetry={() => void teamChatsQuery.refetch()}
            errorMessage={
              teamChatsQuery.error ? handleApiError(teamChatsQuery.error).message : undefined
            }
          />
        ) : null}
      </div>
    </OverlayModal>
  );
};

const StepIndicator = ({ current }: { current: Step }): React.JSX.Element => (
  <ol className="flex items-center gap-2 text-xs" aria-label="공유 단계">
    {[1, 2, 3].map((n) => {
      const stepNum = n as Step;
      const isActive = stepNum === current;
      const isDone = stepNum < current;
      return (
        <li key={n} className="flex items-center gap-2">
          <span
            className={[
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : isDone
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-surface text-text-subtle'
            ].join(' ')}
            aria-current={isActive ? 'step' : undefined}
          >
            {n}
          </span>
          <span
            className={[
              'text-xs',
              isActive ? 'text-text-base font-medium' : 'text-text-subtle',
              // 모바일에선 진행중 스텝 라벨만 보여 320px 에서 가로 초과를 방지.
              isActive ? '' : 'max-sm:hidden'
            ].join(' ')}
          >
            {stepLabels[stepNum]}
          </span>
          {n < 3 ? <span className="text-text-subtle">›</span> : null}
        </li>
      );
    })}
  </ol>
);

type FooterActionsProps = {
  step: Step;
  onBack: () => void;
  onNext: () => void;
  onShare: () => void;
  onCancel: () => void;
  canNext: boolean;
  canShare: boolean;
  isSharing: boolean;
  chatName: string;
};

const FooterActions = ({
  step,
  onBack,
  onNext,
  onShare,
  onCancel,
  canNext,
  canShare,
  isSharing,
  chatName
}: FooterActionsProps): React.JSX.Element => (
  // OverlayModal 의 footer 슬롯에 렌더되므로 sticky/음수마진 불필요 — 항상 바디 아래 shrink-0 로 붙는다.
  <div className="flex items-center justify-between gap-2">
    <span className="min-w-0 truncate text-xs text-text-subtle max-sm:hidden">
      원본: <span className="font-medium text-text-base">{chatName}</span>
    </span>
    <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-end">
      {step > 1 ? (
        <Button type="button" size="sm" variant="ghost" onClick={onBack}>
          뒤로
        </Button>
      ) : (
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          취소
        </Button>
      )}
      {step < 3 ? (
        <Button type="button" size="sm" onClick={onNext} disabled={!canNext}>
          다음
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={onShare}
          disabled={!canShare}
          isLoading={isSharing}
        >
          공유하기
        </Button>
      )}
    </div>
  </div>
);
