import type { ChatMessage } from '../../../api/contracts/chats';

// Step1 리스트에 렌더할 pair 아이템.
// question 은 짝이 되는 user 메시지, answerPreview 는 assistant 답변 앞부분.
export type Step1PairItem = {
  messageId: string;
  question: string;
  answerPreview: string;
};

// ChatMessage 배열과 selectedIds 로 Step1 렌더에 필요한 pair 를 만든다.
// question 은 assistant 메시지 바로 직전의 user 메시지에서 뽑는다.
export const buildStep1Pairs = (
  messages: ChatMessage[],
  selectedIds: Set<string>
): Step1PairItem[] => {
  if (selectedIds.size === 0) return [];
  const result: Step1PairItem[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i];
    if (!selectedIds.has(m.id)) continue;
    if (m.role !== 'assistant') continue;
    const prev = i > 0 ? messages[i - 1] : null;
    const question = prev?.role === 'user' ? prev.content : '(관련 질문을 찾지 못했습니다)';
    result.push({
      messageId: m.id,
      question,
      answerPreview: m.content
    });
  }
  return result;
};
