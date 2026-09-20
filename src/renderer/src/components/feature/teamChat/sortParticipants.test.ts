import { describe, expect, it } from 'vitest';
import type { TeamChatParticipant } from '../../../api/contracts/teamChat';
import { sortParticipants } from './sortParticipants';

const p = (
  overrides: Partial<TeamChatParticipant> & { userId: string; userName?: string }
): TeamChatParticipant => ({
  chatId: 'chat-1',
  avatarUrl: null,
  memberRole: 'MEMBER',
  joinedAt: '2026-01-01T00:00:00.000Z',
  userName: overrides.userName ?? overrides.userId,
  ...overrides
});

describe('sortParticipants', () => {
  it('방장이 최상단에 오고 나머지는 이름 오름차순으로 정렬된다', () => {
    const result = sortParticipants([
      p({ userId: 'u1', userName: '지호' }),
      p({ userId: 'u2', userName: '가온', memberRole: 'OWNER' }),
      p({ userId: 'u3', userName: '나연' })
    ]);
    expect(result.map((it) => it.userName)).toEqual(['가온', '나연', '지호']);
  });

  it('여러 명이 OWNER 여도 이름순으로 두 명 모두 상단에 유지된다', () => {
    const result = sortParticipants([
      p({ userId: 'u1', userName: '지호' }),
      p({ userId: 'u2', userName: '나연', memberRole: 'OWNER' }),
      p({ userId: 'u3', userName: '가온', memberRole: 'OWNER' })
    ]);
    expect(result.map((it) => it.userName)).toEqual(['가온', '나연', '지호']);
  });

  it('ownerId 인자가 있으면 memberRole 이 MEMBER 여도 최상단으로 이동한다', () => {
    // 양도 직후 클라이언트 캐시가 아직 이전 role 을 담고 있을 때의 편의 오버라이드.
    const result = sortParticipants(
      [
        p({ userId: 'new-owner', userName: '나연', memberRole: 'MEMBER' }),
        p({ userId: 'u2', userName: '가온', memberRole: 'MEMBER' })
      ],
      'new-owner'
    );
    expect(result.map((it) => it.userName)).toEqual(['나연', '가온']);
  });

  it('sensitivity base 로 대소문자를 무시하고 라틴 알파벳끼리는 사전순 정렬된다', () => {
    // 라틴/한글 혼합 시 실제 순서는 ICU 구현에 따라 다를 수 있어 assertion 을 라틴 그룹
    // 내부의 상대적 순서로만 좁힌다. 대소문자만 다른 두 이름은 sensitivity base 로 순서가
    // 안정적으로 결정된다.
    const result = sortParticipants([
      p({ userId: 'u1', userName: 'alice' }),
      p({ userId: 'u2', userName: 'Bob' }),
      p({ userId: 'u3', userName: 'Charlie' })
    ]);
    expect(result.map((it) => it.userName)).toEqual(['alice', 'Bob', 'Charlie']);
  });

  it('viewerId 를 넘기면 방장 바로 다음에 뷰어가 온다', () => {
    const result = sortParticipants(
      [
        p({ userId: 'me', userName: '지호' }),
        p({ userId: 'u2', userName: '가온', memberRole: 'OWNER' }),
        p({ userId: 'u3', userName: '나연' }),
        p({ userId: 'u4', userName: '다희' })
      ],
      undefined,
      'me'
    );
    expect(result.map((it) => it.userName)).toEqual(['가온', '지호', '나연', '다희']);
  });

  it('뷰어가 방장이면 그대로 최상단에 있고 정렬에 영향 없음', () => {
    const result = sortParticipants(
      [
        p({ userId: 'me', userName: '가온', memberRole: 'OWNER' }),
        p({ userId: 'u2', userName: '지호' }),
        p({ userId: 'u3', userName: '나연' })
      ],
      undefined,
      'me'
    );
    expect(result.map((it) => it.userName)).toEqual(['가온', '나연', '지호']);
  });

  it('입력 배열을 변형하지 않는다', () => {
    const list: TeamChatParticipant[] = [
      p({ userId: 'u1', userName: '지호' }),
      p({ userId: 'u2', userName: '가온', memberRole: 'OWNER' })
    ];
    const snapshot = list.map((it) => it.userId);
    sortParticipants(list);
    expect(list.map((it) => it.userId)).toEqual(snapshot);
  });
});
