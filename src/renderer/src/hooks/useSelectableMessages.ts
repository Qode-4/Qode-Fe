import { useMemo } from 'react';
import type { ChatMessage } from '../api/contracts/chats';

// 개인채팅 답변 중 팀 공유 후보로 뽑을 수 있는지 판단한다.
// 조건: role='assistant' && status='complete' && content 비어 있지 않음.
// 스트리밍 중이거나 실패한 답변은 체크박스 disabled 로 표시.

export type SelectableReason = 'ok' | 'streaming' | 'failed' | 'empty' | 'not-assistant';

export type SelectableMessage = {
  message: ChatMessage;
  selectable: boolean;
  reason: SelectableReason;
  disabledReason?: string;
};

const disabledCopy: Record<Exclude<SelectableReason, 'ok'>, string> = {
  streaming: '답변이 아직 만들어지는 중이에요.',
  failed: '답변을 만들지 못해서 공유할 수 없어요.',
  empty: '공유할 내용이 없어요.',
  'not-assistant': 'AI 답변만 공유할 수 있어요.'
};

const evaluate = (message: ChatMessage): SelectableReason => {
  if (message.role !== 'assistant') return 'not-assistant';
  const status = message.status ?? 'complete';
  if (status === 'streaming') return 'streaming';
  if (status === 'failed') return 'failed';
  if (!message.content || message.content.trim().length === 0) return 'empty';
  return 'ok';
};

export const useSelectableMessages = (messages: ChatMessage[] | undefined): SelectableMessage[] => {
  return useMemo(() => {
    if (!messages) return [];
    return messages.map((message) => {
      const reason = evaluate(message);
      const selectable = reason === 'ok';
      return {
        message,
        selectable,
        reason,
        disabledReason: selectable
          ? undefined
          : disabledCopy[reason as Exclude<SelectableReason, 'ok'>]
      };
    });
  }, [messages]);
};

// Step1 모달에서 선택된 pair 를 대화 시간순으로 정렬해 반환.
// 사용자의 클릭 순서가 아니라 원본 대화 순서를 유지한다(요약 품질).
export const orderSelectedByChronology = (
  messages: ChatMessage[] | undefined,
  selectedIds: Set<string>
): ChatMessage[] => {
  if (!messages || selectedIds.size === 0) return [];
  return messages.filter((m) => selectedIds.has(m.id));
};
