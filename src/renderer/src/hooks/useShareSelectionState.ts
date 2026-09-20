import { useCallback, useMemo, useState } from 'react';
import { MAX_SHARE_PAIRS } from '../api/contracts/digest';

// 개인채팅에서 "팀 공유" 선택 모드 상태를 관리한다.
// 선택된 message 는 pair 단위(질문+답변 한 쌍)를 대표하는 assistant message id.
// 상한(MAX_SHARE_PAIRS) 넘으면 새 선택은 무시.
// 최소 1개 방어는 wizard 진입 후(Step1)의 책임 — 여기선 0개도 허용해 진입 전 상태를 자유롭게 다룬다.

export type ShareSelectionState = {
  selectionMode: boolean;
  selectedIds: Set<string>;
  count: number;
  canSelectMore: boolean;
  isAtLimit: boolean;
  isSelected: (messageId: string) => boolean;
  enter: (initialId?: string) => void;
  exit: () => void;
  toggle: (messageId: string) => void;
  add: (messageId: string) => void;
  remove: (messageId: string) => void;
  clear: () => void;
};

export const useShareSelectionState = (): ShareSelectionState => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const count = selectedIds.size;
  const isAtLimit = count >= MAX_SHARE_PAIRS;
  const canSelectMore = !isAtLimit;

  const isSelected = useCallback((messageId: string) => selectedIds.has(messageId), [selectedIds]);

  const enter = useCallback((initialId?: string) => {
    setSelectionMode(true);
    if (initialId) {
      setSelectedIds((prev) => {
        if (prev.has(initialId)) return prev;
        if (prev.size >= MAX_SHARE_PAIRS) return prev;
        const next = new Set(prev);
        next.add(initialId);
        return next;
      });
    }
  }, []);

  const exit = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const add = useCallback((messageId: string) => {
    setSelectedIds((prev) => {
      if (prev.has(messageId)) return prev;
      if (prev.size >= MAX_SHARE_PAIRS) return prev;
      const next = new Set(prev);
      next.add(messageId);
      return next;
    });
  }, []);

  const remove = useCallback((messageId: string) => {
    setSelectedIds((prev) => {
      if (!prev.has(messageId)) return prev;
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
  }, []);

  const toggle = useCallback((messageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        if (prev.size >= MAX_SHARE_PAIRS) return prev;
        next.add(messageId);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return useMemo(
    () => ({
      selectionMode,
      selectedIds,
      count,
      canSelectMore,
      isAtLimit,
      isSelected,
      enter,
      exit,
      toggle,
      add,
      remove,
      clear
    }),
    [
      selectionMode,
      selectedIds,
      count,
      canSelectMore,
      isAtLimit,
      isSelected,
      enter,
      exit,
      toggle,
      add,
      remove,
      clear
    ]
  );
};
