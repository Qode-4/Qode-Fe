// sync 에러 코드 → 사용자 노출 문구 매핑.
// 서버가 신설 예정인 코드(REPO_SIZE_LIMIT_EXCEEDED, REPO_EMPTY)는 왼쪽 키만 자리 잡아둔다.
export const mapSyncError = (code?: string | null): string => {
  switch (code) {
    case 'PROJECT_SYNC_OAUTH_REAUTH_REQUIRED':
      return '저장소 접근 권한이 필요해요. GitHub 연동을 다시 진행해주세요.';
    case 'PROJECT_SYNC_REPO_ACCESS_DENIED_OR_NOT_FOUND':
      return '연결된 저장소를 찾을 수 없어요. 다른 저장소로 바꿔주세요.';
    case 'PROJECT_SYNC_TIMEOUT':
      return '동기화가 너무 오래 걸렸어요. 다시 시도해주세요.';
    case 'REPO_SIZE_LIMIT_EXCEEDED':
      return '저장소가 500MB를 넘어요. 더 작은 저장소를 선택해주세요.';
    case 'REPO_EMPTY':
      return '코드가 없는 저장소예요. 코드가 있는 저장소를 선택해주세요.';
    case 'PROJECT_SYNC_INDEX_FAILED':
      return '코드를 분석(인덱싱)하지 못했어요. 다시 동기화해주세요.';
    case 'PROJECT_SYNC_STORAGE_ERROR':
      return '코드를 동기화하지 못했어요. 다시 시도해주세요.';
    case 'PROJECT_SYNC_NETWORK_ERROR':
    case 'PROJECT_SYNC_UNKNOWN_ERROR':
    default:
      return 'GitHub 연동 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.';
  }
};
