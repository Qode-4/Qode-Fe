// sync 에러 코드 → 사용자 노출 문구 매핑.
// 서버가 신설 예정인 코드(REPO_SIZE_LIMIT_EXCEEDED, REPO_EMPTY)는 왼쪽 키만 자리 잡아둔다.
export const mapSyncError = (code?: string | null): string => {
  switch (code) {
    case 'PROJECT_SYNC_OAUTH_REAUTH_REQUIRED':
      return '레포지토리 접근 권한이 필요합니다. GitHub 연동을 다시 진행해주세요.';
    case 'PROJECT_SYNC_REPO_ACCESS_DENIED_OR_NOT_FOUND':
      return '연결된 레포지토리를 찾을 수 없습니다. 다른 레포지토리로 변경해주세요.';
    case 'PROJECT_SYNC_TIMEOUT':
      return '동기화 시간이 초과되었습니다. 다시 시도해주세요.';
    case 'REPO_SIZE_LIMIT_EXCEEDED':
      return '레포지토리 크기가 500MB를 초과합니다. 더 작은 레포지토리를 선택해주세요.';
    case 'REPO_EMPTY':
      return '코드가 없는 레포지토리입니다. 코드가 있는 레포지토리를 선택해주세요.';
    case 'PROJECT_SYNC_INDEX_FAILED':
      return '코드 분석(인덱싱)에 실패했습니다. 다시 동기화해주세요.';
    case 'PROJECT_SYNC_STORAGE_ERROR':
      return '코드 동기화에 실패했습니다. 다시 시도해주세요.';
    case 'PROJECT_SYNC_NETWORK_ERROR':
    case 'PROJECT_SYNC_UNKNOWN_ERROR':
    default:
      return 'GitHub 연동 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
};
